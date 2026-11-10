import { mkdtempSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listCountries } from './database/country-repository.ts';
import { listGenres } from './database/genre-repository.ts';

const DEFAULT_DATABASE_PATH = '/tmp/movies-default.sqlite';

const closeMock = vi.fn();
const getDatabaseMock = vi.fn<(path: string) => unknown>(() => ({
  close: closeMock,
}));

vi.mock('./database/schema.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./database/schema.ts')>()),
  DEFAULT_DATABASE_PATH,
  getDatabase: getDatabaseMock,
}));

/**
 * Executes the backend CLI with the specified command-line arguments
 * @param args The command-line arguments to pass to the CLI
 */
async function runCliWithArgs(args: string[]): Promise<void> {
  const originalArgv = process.argv;
  process.argv = ['node', 'src/back-end/backend-cli.ts', ...args];
  try {
    await import('./backend-cli.ts');
  } finally {
    process.argv = originalArgv;
  }
}

/**
 * Creates an in-memory database with the full schema and makes the mocked
 * getDatabase return it. Its close method is spied and left open so the
 * test can still read the data afterwards.
 * @returns The in-memory database.
 */
async function useInMemoryDatabase(): Promise<DatabaseSync> {
  const { initializeSchema } = await import('./database/schema.ts');
  const database = new DatabaseSync(':memory:');
  initializeSchema(database);
  vi.spyOn(database, 'close').mockImplementation(closeMock);
  getDatabaseMock.mockReturnValueOnce(database);
  return database;
}

/**
 * Writes a CSV file in a temporary directory.
 * @param content The content of the file.
 * @returns The path of the file.
 */
function writeCsvFile(content: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'genres-csv-')), 'genres.csv');
  writeFileSync(path, content);
  return path;
}

describe('backend-cli.ts', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('create-database', () => {
    it('uses the default database path when the subcommand has no path option', async () => {
      await runCliWithArgs(['create-database']);

      expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `Database available at ${resolve(DEFAULT_DATABASE_PATH)}`,
      );
    });

    it('uses the path passed in --path', async () => {
      const customDatabasePath = './data/custom-movies.sqlite';

      await runCliWithArgs(['create-database', '--path', customDatabasePath]);

      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `Database available at ${resolve(customDatabasePath)}`,
      );
    });
  });

  describe('add-genres', () => {
    it('imports the genres of the CSV file into the default database', async () => {
      // Arrange
      const database = await useInMemoryDatabase();
      const csvFile = writeCsvFile('id,name\n28,Action\n18,Drama\n');

      // Act
      await runCliWithArgs(['add-genres', csvFile]);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
      expect(listGenres(database)).toEqual([
        { id: 18, name: 'Drama' },
        { id: 28, name: 'Action' },
      ]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `2 genre(s) imported into ${resolve(DEFAULT_DATABASE_PATH)}`,
      );
    });

    it('updates existing genres of the database selected with --path', async () => {
      // Arrange: the database already contains genre 18 with another name
      const customDatabasePath = './data/custom-movies.sqlite';
      const database = await useInMemoryDatabase();
      database.prepare("INSERT INTO genres VALUES (18, 'Drame')").run();
      const csvFile = writeCsvFile('id,name\n18,Drama\n');

      // Act
      await runCliWithArgs([
        '--path',
        customDatabasePath,
        'add-genres',
        csvFile,
      ]);

      // Assert: the name is updated without creating a duplicate
      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(listGenres(database)).toEqual([{ id: 18, name: 'Drama' }]);
      expect(logSpy).toHaveBeenCalledWith(
        `1 genre(s) imported into ${resolve(customDatabasePath)}`,
      );
    });

    it('does not open the database when the CSV file is invalid', async () => {
      // Arrange
      const csvFile = writeCsvFile('id,label\n28,Action\n');

      // Act & Assert
      await expect(runCliWithArgs(['add-genres', csvFile])).rejects.toThrow(
        /Invalid genres CSV header/,
      );
      expect(getDatabaseMock).not.toHaveBeenCalled();
    });

    it('rolls back the import, closes the database and rethrows when a genre cannot be saved', async () => {
      // Arrange: a trigger makes the insertion of genre 99 fail
      const database = await useInMemoryDatabase();
      database.exec(`
        CREATE TRIGGER reject_genre BEFORE INSERT ON genres
        WHEN NEW.id = 99 BEGIN SELECT RAISE(ABORT, 'genre rejected'); END;
      `);
      const csvFile = writeCsvFile('id,name\n28,Action\n99,Unknown\n');

      // Act & Assert
      await expect(runCliWithArgs(['add-genres', csvFile])).rejects.toThrow(
        'genre rejected',
      );
      expect(listGenres(database)).toEqual([]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('clean-genres', () => {
    it('deletes only the unused genres of the database selected with --path', async () => {
      // Arrange: drama is linked to a movie, action is not
      const customDatabasePath = './data/custom-movies.sqlite';
      const database = await useInMemoryDatabase();
      database.exec(`
        INSERT INTO genres VALUES (18, 'Drama'), (28, 'Action');
        INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
        VALUES (1, 'Fight Club', 'Fight Club', 'en', '', '2026-01-01');
        INSERT INTO movie_genres VALUES (1, 18);
      `);

      // Act
      await runCliWithArgs(['--path', customDatabasePath, 'clean-genres']);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(listGenres(database)).toEqual([{ id: 18, name: 'Drama' }]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `1 unused genre(s) deleted from ${resolve(customDatabasePath)}`,
      );
    });

    it('closes the database and rethrows when the cleanup fails', async () => {
      // Arrange: a database without schema makes the query fail
      getDatabaseMock.mockReturnValueOnce({
        close: closeMock,
        prepare: () => {
          throw new Error('no such table: genres');
        },
      });

      // Act & Assert
      await expect(runCliWithArgs(['clean-genres'])).rejects.toThrow(
        'no such table: genres',
      );
      expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('add-countries', () => {
    it('imports the countries of the CSV file into the default database', async () => {
      // Arrange
      const database = await useInMemoryDatabase();
      const csvFile = writeCsvFile('code,name\nUS,United States\nFR,France\n');

      // Act
      await runCliWithArgs(['add-countries', csvFile]);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
      expect(listCountries(database)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States' },
      ]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `2 country(ies) imported into ${resolve(DEFAULT_DATABASE_PATH)}`,
      );
    });

    it('updates existing countries of the database selected with --path', async () => {
      // Arrange: the database already contains GB with another name
      const customDatabasePath = './data/custom-movies.sqlite';
      const database = await useInMemoryDatabase();
      database
        .prepare("INSERT INTO countries VALUES ('GB', 'Royaume-Uni')")
        .run();
      const csvFile = writeCsvFile('code,name\nGB,United Kingdom\n');

      // Act
      await runCliWithArgs([
        '--path',
        customDatabasePath,
        'add-countries',
        csvFile,
      ]);

      // Assert: the name is updated without creating a duplicate
      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(listCountries(database)).toEqual([
        { code: 'GB', name: 'United Kingdom' },
      ]);
      expect(logSpy).toHaveBeenCalledWith(
        `1 country(ies) imported into ${resolve(customDatabasePath)}`,
      );
    });

    it('does not open the database when the CSV file is invalid', async () => {
      // Arrange
      const csvFile = writeCsvFile('code,name\nfr,France\n');

      // Act & Assert
      await expect(runCliWithArgs(['add-countries', csvFile])).rejects.toThrow(
        /Invalid country code "fr"/,
      );
      expect(getDatabaseMock).not.toHaveBeenCalled();
    });

    it('rolls back the import, closes the database and rethrows when a country cannot be saved', async () => {
      // Arrange: a trigger makes the insertion of XX fail
      const database = await useInMemoryDatabase();
      database.exec(`
        CREATE TRIGGER reject_country BEFORE INSERT ON countries
        WHEN NEW.code = 'XX' BEGIN SELECT RAISE(ABORT, 'country rejected'); END;
      `);
      const csvFile = writeCsvFile('code,name\nFR,France\nXX,Unknown\n');

      // Act & Assert
      await expect(runCliWithArgs(['add-countries', csvFile])).rejects.toThrow(
        'country rejected',
      );
      expect(listCountries(database)).toEqual([]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('clean-countries', () => {
    it('deletes only the unused countries of the database selected with --path', async () => {
      // Arrange: France is linked to a movie, the United States are not
      const customDatabasePath = './data/custom-movies.sqlite';
      const database = await useInMemoryDatabase();
      database.exec(`
        INSERT INTO countries VALUES ('FR', 'France'), ('US', 'United States');
        INSERT INTO movies (id, title, original_title, original_language, overview, collected_at)
        VALUES (1, 'Amélie', 'Le Fabuleux Destin d''Amélie Poulain', 'fr', '', '2026-01-01');
        INSERT INTO production_countries VALUES (1, 'FR');
      `);

      // Act
      await runCliWithArgs(['--path', customDatabasePath, 'clean-countries']);

      // Assert
      expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
      expect(listCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith(
        `1 unused country(ies) deleted from ${resolve(customDatabasePath)}`,
      );
    });

    it('closes the database and rethrows when the cleanup fails', async () => {
      // Arrange: a database without schema makes the query fail
      getDatabaseMock.mockReturnValueOnce({
        close: closeMock,
        prepare: () => {
          throw new Error('no such table: countries');
        },
      });

      // Act & Assert
      await expect(runCliWithArgs(['clean-countries'])).rejects.toThrow(
        'no such table: countries',
      );
      expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();
    });
  });
});
