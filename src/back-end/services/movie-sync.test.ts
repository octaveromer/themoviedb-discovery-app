import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listCountries } from '../database/country-repository.ts';
import { listGenres } from '../database/genre-repository.ts';
import {
  findMovieById,
  listMovieCountryCodes,
  listMovieGenreIds,
  listMovies,
} from '../database/movie-repository.ts';
import { initializeSchema } from '../database/schema.ts';
import type {
  TmdbMovieFullDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes.ts';
import { syncMoviesByYear } from './movie-sync.ts';

// The TMDB client is replaced by mocks: no request is sent to TMDB
const { fetchDiscoverMoviesMock, fetchMovieDetailsMock } = vi.hoisted(() => ({
  fetchDiscoverMoviesMock: vi.fn(),
  fetchMovieDetailsMock: vi.fn(),
}));

vi.mock('../utils/tmdb-client.ts', () => ({
  fetchDiscoverMovies: fetchDiscoverMoviesMock,
  fetchMovieDetails: fetchMovieDetailsMock,
}));

const COLLECTED_AT = '2026-11-16T10:00:00.000Z';

/**
 * Creates the TMDB details of a movie, with some values replaced.
 * @param changes The values to replace.
 */
function movieDetails(
  changes: Partial<TmdbMovieFullDetails>,
): TmdbMovieFullDetails {
  return {
    adult: false,
    backdrop_path: '/backdrop.jpg',
    id: 1,
    original_language: 'en',
    original_title: 'Movie',
    overview: 'Overview',
    popularity: 10,
    poster_path: '/poster.jpg',
    release_date: '2020-01-01',
    title: 'Movie',
    video: false,
    vote_average: 7,
    vote_count: 100,
    genres: [],
    tagline: null,
    production_companies: [],
    runtime: 100,
    budget: 1000000,
    revenue: 5000000,
    production_countries: [],
    ...changes,
  };
}

const parasite = movieDetails({
  id: 496243,
  title: 'Parasite',
  original_title: '기생충',
  original_language: 'ko',
  release_date: '2019-05-30',
  genres: [
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
  ],
  production_countries: [{ iso_3166_1: 'KR', name: 'South Korea' }],
});

// TMDB uses an empty date and 0 for unknown values
const unknownMovie = movieDetails({
  id: 999,
  title: 'Unknown',
  release_date: '',
  runtime: 0,
  budget: 0,
  revenue: 0,
  genres: [{ id: 18, name: 'Drama' }],
  production_countries: [
    { iso_3166_1: 'KR', name: 'South Korea' },
    { iso_3166_1: 'US', name: 'United States of America' },
  ],
});

/**
 * Creates a Discover page that lists the given movies.
 * @param movies The movies of the page.
 * @param page The page number.
 * @param totalPages The number of pages announced by TMDB.
 */
function discoverPage(
  movies: TmdbMovieFullDetails[],
  page = 1,
  totalPages = 1,
): TmdbMoviesRawResponse {
  return {
    page,
    // Discover lists the movies with their genre identifiers only
    results: movies.map((movie) => ({
      adult: movie.adult,
      backdrop_path: movie.backdrop_path,
      genre_ids: movie.genres.map((genre) => genre.id),
      id: movie.id,
      original_language: movie.original_language,
      original_title: movie.original_title,
      overview: movie.overview,
      popularity: movie.popularity,
      poster_path: movie.poster_path ?? '',
      release_date: movie.release_date,
      title: movie.title,
      video: movie.video,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
    })),
    total_pages: totalPages,
    total_results: movies.length,
  };
}

/**
 * Makes the mocked TMDB client return the given movies on a single page.
 * @param movies The movies returned by TMDB.
 */
function mockTmdb(movies: TmdbMovieFullDetails[]): void {
  fetchDiscoverMoviesMock.mockResolvedValue(discoverPage(movies));
  fetchMovieDetailsMock.mockImplementation(async (id: number) =>
    movies.find((movie) => movie.id === id),
  );
}

describe('movie-sync.ts', () => {
  let database: DatabaseSync;

  beforeEach(() => {
    // Fresh in-memory database with the foreign keys checked, as in getDatabase
    database = new DatabaseSync(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    initializeSchema(database);
    vi.clearAllMocks();
  });

  afterEach(() => {
    database.close();
  });

  describe('syncMoviesByYear', () => {
    it('saves the movies of the year with their genres and countries', async () => {
      // Arrange
      mockTmdb([parasite, unknownMovie]);

      // Act
      const result = await syncMoviesByYear(database, '2019', 1, COLLECTED_AT);

      // Assert: the counts do not include duplicates
      expect(result).toEqual({ movies: 2, genres: 2, countries: 2 });
      expect(fetchDiscoverMoviesMock).toHaveBeenCalledWith('2019', 1);
      expect(listGenres(database)).toEqual([
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedy' },
      ]);
      expect(listCountries(database)).toEqual([
        { code: 'KR', name: 'South Korea' },
        { code: 'US', name: 'United States of America' },
      ]);
      expect(findMovieById(database, 496243)).toMatchObject({
        title: 'Parasite',
        original_title: '기생충',
        runtime_minutes: 100,
        budget: 1000000,
        collected_at: COLLECTED_AT,
      });
      expect(listMovieGenreIds(database, 496243)).toEqual([18, 35]);
      expect(listMovieCountryCodes(database, 999)).toEqual(['KR', 'US']);
    });

    it('stores an empty release date and zero amounts as null', async () => {
      // Arrange
      mockTmdb([unknownMovie]);

      // Act
      await syncMoviesByYear(database, '2020', 1, COLLECTED_AT);

      // Assert
      expect(findMovieById(database, 999)).toMatchObject({
        release_date: null,
        runtime_minutes: null,
        budget: null,
        revenue: null,
      });
    });

    it('updates an existing movie and replaces its genres and countries', async () => {
      // Arrange: a first synchronization saves Parasite as a comedy and a drama
      mockTmdb([parasite]);
      await syncMoviesByYear(database, '2019', 1, COLLECTED_AT);
      const updatedParasite = {
        ...parasite,
        vote_average: 8.5,
        genres: [{ id: 53, name: 'Thriller' }],
      };
      mockTmdb([updatedParasite]);

      // Act
      await syncMoviesByYear(database, '2019', 1, '2026-11-17T10:00:00.000Z');

      // Assert: the movie is not duplicated and its old genres are removed
      expect(listMovies(database)).toHaveLength(1);
      expect(findMovieById(database, 496243)).toMatchObject({
        vote_average: 8.5,
        collected_at: '2026-11-17T10:00:00.000Z',
      });
      expect(listMovieGenreIds(database, 496243)).toEqual([53]);
    });

    it('reads the requested number of pages and stops at the last TMDB page', async () => {
      // Arrange: TMDB has only 2 pages, 5 are requested
      fetchDiscoverMoviesMock
        .mockResolvedValueOnce(discoverPage([parasite], 1, 2))
        .mockResolvedValueOnce(discoverPage([unknownMovie], 2, 2));
      fetchMovieDetailsMock
        .mockResolvedValueOnce(parasite)
        .mockResolvedValueOnce(unknownMovie);

      // Act
      const result = await syncMoviesByYear(database, '2019', 5, COLLECTED_AT);

      // Assert
      expect(fetchDiscoverMoviesMock).toHaveBeenCalledTimes(2);
      expect(fetchDiscoverMoviesMock).toHaveBeenLastCalledWith('2019', 2);
      expect(result.movies).toBe(2);
    });

    it('reads only the first page by default', async () => {
      // Arrange: TMDB has 3 pages
      fetchDiscoverMoviesMock.mockResolvedValue(discoverPage([], 1, 3));

      // Act
      const result = await syncMoviesByYear(database, '2019');

      // Assert
      expect(fetchDiscoverMoviesMock).toHaveBeenCalledOnce();
      expect(result).toEqual({ movies: 0, genres: 0, countries: 0 });
    });

    it('saves nothing when a TMDB request fails', async () => {
      // Arrange: the details of the second movie cannot be fetched
      fetchDiscoverMoviesMock.mockResolvedValue(
        discoverPage([parasite, unknownMovie]),
      );
      fetchMovieDetailsMock
        .mockResolvedValueOnce(parasite)
        .mockRejectedValueOnce(new Error('TMDB unavailable'));

      // Act & Assert
      await expect(syncMoviesByYear(database, '2019')).rejects.toThrow(
        'TMDB unavailable',
      );
      expect(listMovies(database)).toEqual([]);
      expect(listGenres(database)).toEqual([]);
    });

    it('saves nothing when a write fails', async () => {
      // Arrange: a trigger makes the insertion of movie 999 fail
      database.exec(`
        CREATE TRIGGER reject_movie BEFORE INSERT ON movies
        WHEN NEW.id = 999 BEGIN SELECT RAISE(ABORT, 'movie rejected'); END;
      `);
      mockTmdb([parasite, unknownMovie]);

      // Act & Assert: the genres, countries and Parasite are cancelled too
      await expect(syncMoviesByYear(database, '2019')).rejects.toThrow(
        'movie rejected',
      );
      expect(listMovies(database)).toEqual([]);
      expect(listGenres(database)).toEqual([]);
      expect(listCountries(database)).toEqual([]);
    });

    it.each([
      ['an invalid year', '20', 1, 'Invalid year "20"'],
      ['a page count of 0', '2020', 0, 'Invalid page count "0"'],
      ['a decimal page count', '2020', 1.5, 'Invalid page count "1.5"'],
    ])(
      'rejects %s without calling TMDB',
      async (_case, year, pageCount, error) => {
        await expect(
          syncMoviesByYear(database, year, pageCount),
        ).rejects.toThrow(error);
        expect(fetchDiscoverMoviesMock).not.toHaveBeenCalled();
      },
    );
  });
});
