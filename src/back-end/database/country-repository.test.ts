import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Country } from '../types/MoviesTypes.ts';
import {
  findCountryByCode,
  listCountries,
  upsertCountries,
} from './country-repository.ts';
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

  describe('findCountryByCode', () => {
    it('returns the country matching the code', () => {
      // Arrange
      upsertCountries(database, [france, unitedStates]);

      // Act & Assert
      expect(findCountryByCode(database, 'US')).toEqual(unitedStates);
    });

    it('returns undefined when no country has the code', () => {
      // Arrange
      upsertCountries(database, [france]);

      // Act & Assert
      expect(findCountryByCode(database, 'DE')).toBeUndefined();
    });
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

  describe('upsertCountries', () => {
    it('inserts new countries', () => {
      // Act
      upsertCountries(database, [france, unitedStates]);

      // Assert
      expect(listCountries(database)).toEqual([france, unitedStates]);
    });

    it('updates the name of an existing country without creating a duplicate', () => {
      // Arrange
      upsertCountries(database, [unitedKingdom]);

      // Act
      upsertCountries(database, [{ code: 'GB', name: 'Royaume-Uni' }]);

      // Assert
      expect(listCountries(database)).toEqual([
        { code: 'GB', name: 'Royaume-Uni' },
      ]);
    });

    it('accepts any iterable of countries', () => {
      // Arrange: a Set and a generator are iterables but not arrays
      function* generateCountries(): Generator<Country> {
        yield unitedKingdom;
        yield unitedStates;
      }

      // Act
      upsertCountries(database, new Set([france]));
      upsertCountries(database, generateCountries());

      // Assert
      expect(listCountries(database)).toEqual([
        france,
        unitedKingdom,
        unitedStates,
      ]);
    });

    it('leaves the data unchanged when the iterable is empty', () => {
      // Arrange
      upsertCountries(database, [france]);

      // Act
      upsertCountries(database, []);

      // Assert
      expect(listCountries(database)).toEqual([france]);
    });

    it('keeps the last name when a code appears several times', () => {
      // Act
      upsertCountries(database, [
        { code: 'FR', name: 'France' },
        { code: 'FR', name: 'République française' },
      ]);

      // Assert
      expect(listCountries(database)).toEqual([
        { code: 'FR', name: 'République française' },
      ]);
    });

    it('rejects a country without a name and saves none of the given countries', () => {
      // Arrange
      upsertCountries(database, [france]);
      const invalidCountry = { code: 'GB', name: null } as unknown as Country;

      // Act & Assert: the NOT NULL constraint on the name is enforced
      expect(() =>
        upsertCountries(database, [unitedStates, invalidCountry]),
      ).toThrow(/NOT NULL constraint failed: countries.name/);

      // Assert: the transaction is rolled back, the United States are not saved
      expect(listCountries(database)).toEqual([france]);
    });
  });
});
