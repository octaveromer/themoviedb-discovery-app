import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StoredMovie } from '../types/MoviesTypes.ts';
import { findMovieById, listMovies, upsertMovies } from './movie-repository.ts';
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

  describe('findMovieById', () => {
    it('returns the movie matching the identifier', () => {
      // Arrange
      upsertMovies(database, [parasite, fightClub]);

      // Act & Assert
      expect(findMovieById(database, 496243)).toEqual(parasite);
    });

    it('returns undefined when no movie has the identifier', () => {
      // Arrange
      upsertMovies(database, [fightClub]);

      // Act & Assert
      expect(findMovieById(database, 999)).toBeUndefined();
    });
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

  describe('upsertMovies', () => {
    it('inserts new movies', () => {
      // Act
      upsertMovies(database, [parasite, fightClub]);

      // Assert
      expect(listMovies(database)).toEqual([fightClub, parasite]);
    });

    it('updates the information of an existing movie without creating a duplicate', () => {
      // Arrange
      upsertMovies(database, [fightClub]);
      const updatedFightClub: StoredMovie = {
        ...fightClub,
        release_date: '1999-10-15',
        vote_average: 8.4,
        runtime_minutes: 139,
        collected_at: '2026-11-17T10:00:00.000Z',
      };

      // Act
      upsertMovies(database, [updatedFightClub]);

      // Assert
      expect(listMovies(database)).toEqual([updatedFightClub]);
    });

    it('computes the release year from the release date', () => {
      // Act
      upsertMovies(database, [parasite]);

      // Assert
      expect(
        database
          .prepare('SELECT release_year FROM movies WHERE id = ?')
          .get(parasite.id),
      ).toEqual({ release_year: 2019 });
    });

    it('accepts any iterable of movies', () => {
      // Arrange: a Set and a generator are iterables but not arrays
      function* generateMovies(): Generator<StoredMovie> {
        yield parasite;
      }

      // Act
      upsertMovies(database, new Set([fightClub]));
      upsertMovies(database, generateMovies());

      // Assert
      expect(listMovies(database)).toEqual([fightClub, parasite]);
    });

    it('leaves the data unchanged when the iterable is empty', () => {
      // Arrange
      upsertMovies(database, [parasite]);

      // Act
      upsertMovies(database, []);

      // Assert
      expect(listMovies(database)).toEqual([parasite]);
    });

    it('keeps the last information when an identifier appears several times', () => {
      // Act
      upsertMovies(database, [
        fightClub,
        { ...fightClub, title: 'Fight Club (1999)' },
      ]);

      // Assert
      expect(listMovies(database)).toEqual([
        { ...fightClub, title: 'Fight Club (1999)' },
      ]);
    });

    it.each([
      [
        'a movie without title',
        { ...fightClub, title: null },
        /NOT NULL constraint failed: movies.title/,
      ],
      [
        'a movie with a negative runtime',
        { ...fightClub, runtime_minutes: -10 },
        /CHECK constraint failed/,
      ],
    ])(
      'rejects %s and saves none of the given movies',
      (_case, invalidMovie, error) => {
        // Arrange
        upsertMovies(database, [parasite]);

        // Act & Assert: the constraints of the movies table are enforced
        expect(() =>
          upsertMovies(database, [
            { ...parasite, title: 'Parasite (updated)' },
            invalidMovie as unknown as StoredMovie,
          ]),
        ).toThrow(error);

        // Assert: the transaction is rolled back, Parasite keeps its title
        expect(listMovies(database)).toEqual([parasite]);
      },
    );
  });
});
