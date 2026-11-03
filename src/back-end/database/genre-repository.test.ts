import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Genre } from '../types/MoviesTypes.ts';
import { findGenreById, listGenres, upsertGenres } from './genre-repository.ts';
import { initializeSchema } from './schema.ts';

describe('genre-repository.ts', () => {
  let database: DatabaseSync;

  const drama: Genre = { id: 18, name: 'Drama' };
  const action: Genre = { id: 28, name: 'Action' };
  const comedy: Genre = { id: 35, name: 'Comedy' };

  beforeEach(() => {
    // Use a fresh in-memory database with the full schema for each test
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('findGenreById', () => {
    it('returns the genre matching the identifier', () => {
      // Arrange
      upsertGenres(database, [drama, action]);

      // Act & Assert
      expect(findGenreById(database, 28)).toEqual(action);
    });

    it('returns undefined when no genre has the identifier', () => {
      // Arrange
      upsertGenres(database, [drama]);

      // Act & Assert
      expect(findGenreById(database, 99)).toBeUndefined();
    });
  });

  describe('listGenres', () => {
    it('returns the genres sorted by ascending identifier', () => {
      // Arrange: insert genres out of order
      const insert = database.prepare(
        'INSERT INTO genres (id, name) VALUES (?, ?)',
      );
      for (const genre of [comedy, drama, action]) {
        insert.run(genre.id, genre.name);
      }

      // Act & Assert
      expect(listGenres(database)).toEqual([drama, action, comedy]);
    });

    it('returns an empty list when there is no genre', () => {
      expect(listGenres(database)).toEqual([]);
    });
  });

  describe('upsertGenres', () => {
    it('inserts new genres', () => {
      // Act
      upsertGenres(database, [drama, action]);

      // Assert
      expect(listGenres(database)).toEqual([drama, action]);
    });

    it('updates the name of an existing genre without creating a duplicate', () => {
      // Arrange
      upsertGenres(database, [drama]);

      // Act
      upsertGenres(database, [{ id: 18, name: 'Drame' }]);

      // Assert
      expect(listGenres(database)).toEqual([{ id: 18, name: 'Drame' }]);
    });

    it('accepts any iterable of genres', () => {
      // Arrange: a Set and a generator are iterables but not arrays
      function* generateGenres(): Generator<Genre> {
        yield action;
        yield comedy;
      }

      // Act
      upsertGenres(database, new Set([drama]));
      upsertGenres(database, generateGenres());

      // Assert
      expect(listGenres(database)).toEqual([drama, action, comedy]);
    });

    it('leaves the data unchanged when the iterable is empty', () => {
      // Arrange
      upsertGenres(database, [drama]);

      // Act
      upsertGenres(database, []);

      // Assert
      expect(listGenres(database)).toEqual([drama]);
    });

    it('keeps the last name when an identifier appears several times', () => {
      // Act
      upsertGenres(database, [
        { id: 18, name: 'Drama' },
        { id: 18, name: 'Drame' },
      ]);

      // Assert
      expect(listGenres(database)).toEqual([{ id: 18, name: 'Drame' }]);
    });

    it('rejects a genre without a name and saves none of the given genres', () => {
      // Arrange
      upsertGenres(database, [drama]);
      const invalidGenre = { id: 28, name: null } as unknown as Genre;

      // Act & Assert: the NOT NULL constraint on the name is enforced
      expect(() => upsertGenres(database, [comedy, invalidGenre])).toThrow(
        /NOT NULL constraint failed: genres.name/,
      );

      // Assert: the transaction is rolled back, comedy is not saved
      expect(listGenres(database)).toEqual([drama]);
    });
  });
});
