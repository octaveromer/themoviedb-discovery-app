import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StoredMovie } from '../types/MoviesTypes.ts';
import { listMovies } from './movie-repository.ts';
import { initializeSchema } from './schema.ts';

describe('movie-repository.ts', () => {
  let database: DatabaseSync;

  const parasite: StoredMovie = {
    id: 496243,
    title: 'Parasite',
    original_title: '기생충',
    original_language: 'ko',
    overview: 'A poor family schemes to become employed by a wealthy family.',
    release_date: '2019-05-30',
    popularity: 95.5,
    vote_average: 8.5,
    vote_count: 18000,
    poster_path: '/parasite-poster.jpg',
    backdrop_path: '/parasite-backdrop.jpg',
    runtime_minutes: 132,
    budget: 11400000,
    revenue: 262000000,
    collected_at: '2026-11-16T10:00:00.000Z',
  };

  // A movie with only the required information
  const fightClub: StoredMovie = {
    id: 550,
    title: 'Fight Club',
    original_title: 'Fight Club',
    original_language: 'en',
    overview: '',
    release_date: null,
    popularity: null,
    vote_average: null,
    vote_count: null,
    poster_path: null,
    backdrop_path: null,
    runtime_minutes: null,
    budget: null,
    revenue: null,
    collected_at: '2026-11-16T10:00:00.000Z',
  };

  /**
   * Inserts movies directly with SQL, to prepare the data of a test.
   * @param movies The movies to insert.
   */
  function insertMovies(movies: StoredMovie[]): void {
    const columns = Object.keys(fightClub);
    const insert = database.prepare(
      `INSERT INTO movies (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    );
    for (const movie of movies) {
      insert.run(...Object.values(movie));
    }
  }

  beforeEach(() => {
    // Use a fresh in-memory database with the full schema for each test
    database = new DatabaseSync(':memory:');
    initializeSchema(database);
  });

  afterEach(() => {
    database.close();
  });

  describe('listMovies', () => {
    it('returns the movies sorted by ascending identifier', () => {
      // Arrange: insert movies out of order
      insertMovies([parasite, fightClub]);

      // Act & Assert: optional values are read back as null
      expect(listMovies(database)).toEqual([fightClub, parasite]);
    });

    it('returns an empty list when there is no movie', () => {
      expect(listMovies(database)).toEqual([]);
    });
  });
});
