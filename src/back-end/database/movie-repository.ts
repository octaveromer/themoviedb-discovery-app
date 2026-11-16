import type { DatabaseSync } from 'node:sqlite';
import type { StoredMovie } from '../types/MoviesTypes.ts';
import { runInTransaction } from './transaction.ts';

// Columns of the movies table read and written by this module.
// The generated release_year column is left out: SQLite computes it.
const MOVIE_COLUMNS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime_minutes',
  'budget',
  'revenue',
  'collected_at',
] as const;

/**
 * Finds a movie by its identifier.
 * @param database The SQLite database to query.
 * @param id The TMDB identifier of the movie.
 * @returns The matching movie, or `undefined` if no movie has this identifier.
 */
export function findMovieById(
  database: DatabaseSync,
  id: number,
): StoredMovie | undefined {
  return database
    .prepare(`SELECT ${MOVIE_COLUMNS.join(', ')} FROM movies WHERE id = ?`)
    .get(id) as StoredMovie | undefined;
}

/**
 * Lists every movie.
 * @param database The SQLite database to query.
 * @returns The movies sorted by ascending identifier, or an empty list if there is none.
 */
export function listMovies(database: DatabaseSync): StoredMovie[] {
  return database
    .prepare(`SELECT ${MOVIE_COLUMNS.join(', ')} FROM movies ORDER BY id ASC`)
    .all() as StoredMovie[];
}

/**
 * Inserts new movies or updates the information of existing ones.
 * All movies are written in a single transaction: if one of them is invalid, none is saved.
 * When an identifier appears several times, the last provided information is kept.
 * @param database The SQLite database to update.
 * @param movies The movies to insert or update.
 */
export function upsertMovies(
  database: DatabaseSync,
  movies: Iterable<StoredMovie>,
): void {
  // On an existing identifier, every column except the id is replaced
  const updates = MOVIE_COLUMNS.filter((column) => column !== 'id').map(
    (column) => `${column} = excluded.${column}`,
  );
  const statement = database.prepare(`
    INSERT INTO movies (${MOVIE_COLUMNS.join(', ')})
    VALUES (${MOVIE_COLUMNS.map(() => '?').join(', ')})
    ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}
  `);

  runInTransaction(database, () => {
    for (const movie of movies) {
      statement.run(...MOVIE_COLUMNS.map((column) => movie[column]));
    }
  });
}

/**
 * Lists the genres of a movie.
 * @param database The SQLite database to query.
 * @param movieId The identifier of the movie.
 * @returns The genre identifiers of the movie, sorted in ascending order.
 */
export function listMovieGenreIds(
  database: DatabaseSync,
  movieId: number,
): number[] {
  return database
    .prepare(
      'SELECT genre_id FROM movie_genres WHERE movie_id = ? ORDER BY genre_id',
    )
    .all(movieId)
    .map((row) => Number(row.genre_id));
}

/**
 * Replaces the genres of a movie: the previous links are removed.
 * The movie and the genres must already exist in the database.
 * @param database The SQLite database to update.
 * @param movieId The identifier of the movie.
 * @param genreIds The identifiers of its genres; a repeated identifier is linked once.
 * @throws {Error} If the movie or a genre does not exist; the previous links are then kept.
 */
export function replaceMovieGenres(
  database: DatabaseSync,
  movieId: number,
  genreIds: Iterable<number>,
): void {
  const insert = database.prepare(
    'INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)',
  );

  runInTransaction(database, () => {
    database
      .prepare('DELETE FROM movie_genres WHERE movie_id = ?')
      .run(movieId);
    for (const genreId of genreIds) {
      insert.run(movieId, genreId);
    }
  });
}

/**
 * Lists the production countries of a movie.
 * @param database The SQLite database to query.
 * @param movieId The identifier of the movie.
 * @returns The country codes of the movie, sorted in ascending order.
 */
export function listMovieCountryCodes(
  database: DatabaseSync,
  movieId: number,
): string[] {
  return database
    .prepare(
      'SELECT country_code FROM production_countries WHERE movie_id = ? ORDER BY country_code',
    )
    .all(movieId)
    .map((row) => String(row.country_code));
}

/**
 * Replaces the production countries of a movie: the previous links are removed.
 * The movie and the countries must already exist in the database.
 * @param database The SQLite database to update.
 * @param movieId The identifier of the movie.
 * @param countryCodes The codes of its countries; a repeated code is linked once.
 * @throws {Error} If the movie or a country does not exist; the previous links are then kept.
 */
export function replaceMovieCountries(
  database: DatabaseSync,
  movieId: number,
  countryCodes: Iterable<string>,
): void {
  const insert = database.prepare(
    'INSERT OR IGNORE INTO production_countries (movie_id, country_code) VALUES (?, ?)',
  );

  runInTransaction(database, () => {
    database
      .prepare('DELETE FROM production_countries WHERE movie_id = ?')
      .run(movieId);
    for (const countryCode of countryCodes) {
      insert.run(movieId, countryCode);
    }
  });
}
