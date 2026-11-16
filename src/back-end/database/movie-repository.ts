import type { DatabaseSync } from 'node:sqlite';
import type { StoredMovie } from '../types/MoviesTypes.ts';

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
 * Lists every movie.
 * @param database The SQLite database to query.
 * @returns The movies sorted by ascending identifier, or an empty list if there is none.
 */
export function listMovies(database: DatabaseSync): StoredMovie[] {
  return database
    .prepare(`SELECT ${MOVIE_COLUMNS.join(', ')} FROM movies ORDER BY id ASC`)
    .all() as StoredMovie[];
}
