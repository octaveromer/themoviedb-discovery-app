import type { DatabaseSync } from 'node:sqlite';
import type { Genre } from '../types/MoviesTypes.ts';

/**
 * Finds a genre by its identifier.
 * @param database The SQLite database to query.
 * @param id The identifier of the genre.
 * @returns The matching genre, or `undefined` if no genre has this identifier.
 */
export function findGenreById(
  database: DatabaseSync,
  id: number,
): Genre | undefined {
  return database
    .prepare('SELECT id, name FROM genres WHERE id = ?')
    .get(id) as Genre | undefined;
}

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

/**
 * Inserts new genres or updates the name of existing ones.
 * All genres are written in a single transaction: if one of them is invalid, none is saved.
 * When an identifier appears several times, the last provided name is kept.
 * @param database The SQLite database to update.
 * @param genres The genres to insert or update.
 */
export function upsertGenres(
  database: DatabaseSync,
  genres: Iterable<Genre>,
): void {
  const statement = database.prepare(`
    INSERT INTO genres (id, name) VALUES (?, ?)
    ON CONFLICT (id) DO UPDATE SET name = excluded.name
  `);

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const genre of genres) {
      statement.run(genre.id, genre.name);
    }
    database.exec('COMMIT;');
  } catch (error) {
    // A genre could not be saved, cancel every change made by this call
    database.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Deletes the genres that are not associated with any movie.
 * @param database The SQLite database to update.
 * @returns The number of deleted genres.
 */
export function deleteUnusedGenres(database: DatabaseSync): number {
  const result = database
    .prepare(
      'DELETE FROM genres WHERE id NOT IN (SELECT genre_id FROM movie_genres)',
    )
    .run();
  return Number(result.changes);
}
