import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Country } from '../types/MoviesTypes.ts';
import { listCountries } from './country-repository.ts';
import { initializeSchema } from './schema.ts';

describe('country-repository.ts', () => {
  let database: DatabaseSync;

  const france: Country = { code: 'FR', name: 'France' };
  const unitedKingdom: Country = { code: 'GB', name: 'United Kingdom' };
  const unitedStates: Country = {
    code: 'US',
    name: 'United States of America',
  };

  beforeEach(() => {
    // Use a fresh in-memory database with the full schema for each test
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('listCountries', () => {
    it('returns the countries sorted by ascending code', () => {
      // Arrange: insert countries out of order
      const insert = database.prepare(
        'INSERT INTO countries (code, name) VALUES (?, ?)',
      );
      for (const country of [unitedStates, france, unitedKingdom]) {
        insert.run(country.code, country.name);
      }

      // Act & Assert
      expect(listCountries(database)).toEqual([
        france,
        unitedKingdom,
        unitedStates,
      ]);
    });

    it('returns an empty list when there is no country', () => {
      expect(listCountries(database)).toEqual([]);
    });
  });
});
