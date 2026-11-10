#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { upsertCountries } from './database/country-repository.ts';
import {
  deleteUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import { parseCountriesCsv } from './utils/countries-csv.ts';
import { parseGenresCsv } from './utils/genres-csv.ts';

/** Command-line interface for movie database operations. */
const program = new Command()
  .description('CLI for movie database operations')
  // The global --path option must be written before the subcommand,
  // so that create-database can keep its own --path option
  .enablePositionalOptions()
  .option(
    '-p, --path <path>',
    'path to the SQLite database file',
    DEFAULT_DATABASE_PATH,
  );

/**
 * Returns the database path given with the global --path option.
 * @returns The database path, or the default one.
 */
function getDatabasePath(): string {
  return program.opts<{ path: string }>().path;
}

program
  .command('create-database')
  .description('Create and initialize the movies database schema')
  .option(
    '-p, --path <path>',
    'path to the SQLite database file',
    DEFAULT_DATABASE_PATH,
  )
  .action(({ path }: { path: string }) => {
    const database = getDatabase(path);
    database.close();
    console.log(`Database available at ${resolve(path)}`);
  });

program
  .command('add-genres')
  .description('Insert or update the genres listed in a CSV file')
  .argument('<csv-file>', 'CSV file with "id" and "name" columns')
  .action((csvFile: string) => {
    // Validate the whole file before opening the database
    const genres = parseGenresCsv(readFileSync(csvFile, 'utf8'));
    const path = getDatabasePath();

    const database = getDatabase(path);
    try {
      upsertGenres(database, genres);
    } finally {
      database.close();
    }
    console.log(`${genres.length} genre(s) imported into ${resolve(path)}`);
  });

program
  .command('clean-genres')
  .description('Delete the genres that are not associated with any movie')
  .action(() => {
    const path = getDatabasePath();

    const database = getDatabase(path);
    let deletedCount: number;
    try {
      deletedCount = deleteUnusedGenres(database);
    } finally {
      database.close();
    }
    console.log(
      `${deletedCount} unused genre(s) deleted from ${resolve(path)}`,
    );
  });

program
  .command('add-countries')
  .description('Insert or update the countries listed in a CSV file')
  .argument('<csv-file>', 'CSV file with "code" and "name" columns')
  .action((csvFile: string) => {
    // Validate the whole file before opening the database
    const countries = parseCountriesCsv(readFileSync(csvFile, 'utf8'));
    const path = getDatabasePath();

    const database = getDatabase(path);
    try {
      upsertCountries(database, countries);
    } finally {
      database.close();
    }
    console.log(
      `${countries.length} country(ies) imported into ${resolve(path)}`,
    );
  });

program.parse();
