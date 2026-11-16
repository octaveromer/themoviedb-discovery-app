#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  deleteUnusedCountries,
  upsertCountries,
} from './database/country-repository.ts';
import {
  deleteUnusedGenres,
  upsertGenres,
} from './database/genre-repository.ts';
import { upsertMovies } from './database/movie-repository.ts';
import { DEFAULT_DATABASE_PATH, getDatabase } from './database/schema.ts';
import { parseCountriesCsv } from './utils/countries-csv.ts';
import { parseGenresCsv } from './utils/genres-csv.ts';
import { parseMoviesCsv } from './utils/movies-csv.ts';

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

program
  .command('clean-countries')
  .description('Delete the countries that are not associated with any movie')
  .action(() => {
    const path = getDatabasePath();

    const database = getDatabase(path);
    let deletedCount: number;
    try {
      deletedCount = deleteUnusedCountries(database);
    } finally {
      database.close();
    }
    console.log(
      `${deletedCount} unused country(ies) deleted from ${resolve(path)}`,
    );
  });

program
  .command('add-movies')
  .description('Insert or update the movies listed in a CSV file')
  .argument('<csv-file>', 'CSV file with the columns of data/movies.csv')
  .action((csvFile: string) => {
    // Validate the whole file before opening the database.
    // The import date is stored as the collection date of each movie.
    const movies = parseMoviesCsv(
      readFileSync(csvFile, 'utf8'),
      new Date().toISOString(),
    );
    const path = getDatabasePath();

    const database = getDatabase(path);
    try {
      upsertMovies(database, movies);
    } finally {
      database.close();
    }
    console.log(`${movies.length} movie(s) imported into ${resolve(path)}`);
  });

program
  .command('sync-movies')
  .description(
    'Update the movies of a release year, with their genres and countries, from TMDB',
  )
  .argument('<year>', 'release year of the movies, e.g. 2020')
  .option(
    '--pages <count>',
    'number of TMDB pages to read (20 movies per page)',
    '1',
  )
  .action(async (year: string, { pages }: { pages: string }) => {
    // The service is loaded only for this command: it needs the TMDB access
    // token, which the other commands do not require
    const { syncMoviesByYear } = await import('./services/movie-sync.ts');
    const path = getDatabasePath();

    const database = getDatabase(path);
    let result: Awaited<ReturnType<typeof syncMoviesByYear>>;
    try {
      result = await syncMoviesByYear(database, year, Number(pages));
    } finally {
      database.close();
    }
    console.log(
      `${result.movies} movie(s), ${result.genres} genre(s) and ${result.countries} country(ies) synced for ${year} into ${resolve(path)}`,
    );
  });

// parseAsync waits for the asynchronous commands and propagates their errors
await program.parseAsync();
