import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/MoviesTypes.ts';

/**
 * Lists every genre.
 * @param database The SQLite database to query.
 * @returns The genres sorted by ascending identifier.
 */
export function listGenres(database: DatabaseSync): Genre[] {
  return database
    .prepare('SELECT id, name FROM genres ORDER BY id ASC')
    .all() as Genre[];
}
