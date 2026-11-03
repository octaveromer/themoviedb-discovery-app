import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Genre } from '../types/MoviesTypes.ts';
import { listGenres } from './genre-repository.ts';
import { initializeSchema } from './schema.ts';

describe('genre-repository.ts', () => {
  let database: DatabaseSync;

  const drama: Genre = { id: 18, name: 'Drama' };
  const action: Genre = { id: 28, name: 'Action' };
  const comedy: Genre = { id: 35, name: 'Comedy' };

  beforeEach(() => {
    // Use a fresh in-memory database with the full schema for each test
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('listGenres', () => {
    it('returns the genres sorted by ascending identifier', () => {
      // Arrange: insert genres out of order
      const insert = database.prepare(
        'INSERT INTO genres (id, name) VALUES (?, ?)',
      );
      for (const genre of [comedy, drama, action]) {
        insert.run(genre.id, genre.name);
      }

      // Act & Assert
      expect(listGenres(database)).toEqual([drama, action, comedy]);
    });

    it('returns an empty list when there is no genre', () => {
      expect(listGenres(database)).toEqual([]);
    });
  });
});
