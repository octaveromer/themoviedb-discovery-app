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
