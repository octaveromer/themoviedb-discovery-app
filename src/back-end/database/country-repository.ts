import type { DatabaseSync } from 'node:sqlite';
import type { Country } from '../types/MoviesTypes.ts';

/**
 * Finds a country by its code.
 * @param database The SQLite database to query.
 * @param code The ISO 3166-1 code of the country (e.g. "FR").
 * @returns The matching country, or `undefined` if no country has this code.
 */
export function findCountryByCode(
  database: DatabaseSync,
  code: string,
): Country | undefined {
  return database
    .prepare('SELECT code, name FROM countries WHERE code = ?')
    .get(code) as Country | undefined;
}

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

/**
 * Inserts new countries or updates the name of existing ones.
 * All countries are written in a single transaction: if one of them is invalid, none is saved.
 * When a code appears several times, the last provided name is kept.
 * @param database The SQLite database to update.
 * @param countries The countries to insert or update.
 */
export function upsertCountries(
  database: DatabaseSync,
  countries: Iterable<Country>,
): void {
  const statement = database.prepare(`
    INSERT INTO countries (code, name) VALUES (?, ?)
    ON CONFLICT (code) DO UPDATE SET name = excluded.name
  `);

  database.exec('BEGIN TRANSACTION;');
  try {
    for (const country of countries) {
      statement.run(country.code, country.name);
    }
    database.exec('COMMIT;');
  } catch (error) {
    // A country could not be saved, cancel every change made by this call
    database.exec('ROLLBACK;');
    throw error;
  }
}

/**
 * Deletes the countries that are not associated with any movie.
 * @param database The SQLite database to update.
 * @returns The number of deleted countries.
 */
export function deleteUnusedCountries(database: DatabaseSync): number {
  const result = database
    .prepare(
      'DELETE FROM countries WHERE code NOT IN (SELECT country_code FROM production_countries)',
    )
    .run();
  return Number(result.changes);
}
