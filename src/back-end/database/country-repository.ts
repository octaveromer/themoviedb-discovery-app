import type { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/MoviesTypes.ts';

/**
 * Lists every country.
 * @param database The SQLite database to query.
 * @returns The countries sorted by ascending code, or an empty list if there is none.
 */
export function listCountries(database: DatabaseSync): Country[] {
  return database
    .prepare('SELECT code, name FROM countries ORDER BY code ASC')
    .all() as Country[];
}
