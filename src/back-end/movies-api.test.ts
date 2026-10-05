import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './index';
import type { TmdbMovie, TmdbMovieDetails } from './schemas/MoviesTypes';

const tmdbMovie: TmdbMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [27],
  id: 42,
  original_language: 'en',
  original_title: 'Resident Evil',
  overview: 'A new era of evil.',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2026-09-18',
  title: 'Resident Evil',
  video: false,
  vote_average: 7.3,
  vote_count: 120,
};

const { genre_ids: _genreIds, ...movieWithoutGenreIds } = tmdbMovie;
const tmdbMovieDetails: TmdbMovieDetails = {
  ...movieWithoutGenreIds,
  genres: [{ id: 27, name: 'Horror' }],
  tagline: 'A new era of evil.',
  production_companies: [],
};

// Mock of the TMDB API: fetch returns a controlled response
const mockTmdbResponse = (body: unknown, status = 200) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.stubEnv('TMDB_ACCESS_TOKEN', 'test-token');
  // keep the test output clean: errors are expected in some tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('GET /api/movies/popular', () => {
  it('returns the popular movies in the supported format', async () => {
    // Arrange
    mockTmdbResponse({
      page: 1,
      results: [tmdbMovie],
      total_pages: 10,
      total_results: 200,
    });

    // Act
    const response = await request(app).get('/api/movies/popular');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.total_pages).toBe(10);
    expect(response.body.total_results).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).not.toHaveProperty('adult');
  });

  it('uses the default language, page and region', async () => {
    // Arrange
    const fetchMock = mockTmdbResponse({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    });

    // Act
    await request(app).get('/api/movies/popular');

    // Assert
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.themoviedb.org/3/movie/popular?language=fr-FR&page=1&region=FR',
    );
    expect(options).toEqual({
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json;charset=utf-8',
      },
    });
  });

  it('forwards the language, page and region query params', async () => {
    // Arrange
    const fetchMock = mockTmdbResponse({
      page: 2,
      results: [],
      total_pages: 0,
      total_results: 0,
    });

    // Act
    await request(app).get(
      '/api/movies/popular?language=en-US&page=2&region=US',
    );

    // Assert
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.themoviedb.org/3/movie/popular?language=en-US&page=2&region=US',
    );
  });

  it('returns an error when the TMDB API fails', async () => {
    // Arrange
    mockTmdbResponse({ status_message: 'Server error' }, 500);

    // Act
    const response = await request(app).get('/api/movies/popular');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch popular movies' });
  });
});

describe('GET /api/movies/:id', () => {
  it('returns the movie details in the supported format', async () => {
    // Arrange
    mockTmdbResponse(tmdbMovieDetails);

    // Act
    const response = await request(app).get('/api/movies/42');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Resident Evil');
    expect(response.body.genres).toEqual([{ id: 27, name: 'Horror' }]);
    expect(response.body).not.toHaveProperty('production_companies');
  });

  it('uses the default language', async () => {
    // Arrange
    const fetchMock = mockTmdbResponse(tmdbMovieDetails);

    // Act
    await request(app).get('/api/movies/42');

    // Assert
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.themoviedb.org/3/movie/42?language=fr-FR',
    );
  });

  it('forwards the language query param', async () => {
    // Arrange
    const fetchMock = mockTmdbResponse(tmdbMovieDetails);

    // Act
    await request(app).get('/api/movies/42?language=en-US');

    // Assert
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.themoviedb.org/3/movie/42?language=en-US',
    );
  });

  it.each(['not-a-number', '0', '-3', '1.5'])(
    'rejects the invalid movie id "%s" without calling TMDB',
    async (id) => {
      // Arrange
      const fetchMock = vi.spyOn(globalThis, 'fetch');

      // Act
      const response = await request(app).get(`/api/movies/${id}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Movie id must be a positive integer',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('returns 404 when the movie does not exist', async () => {
    // Arrange
    mockTmdbResponse({ status_message: 'Not found' }, 404);

    // Act
    const response = await request(app).get('/api/movies/999999');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });

  it('returns an error when the TMDB API fails', async () => {
    // Arrange
    mockTmdbResponse({ status_message: 'Server error' }, 500);

    // Act
    const response = await request(app).get('/api/movies/42');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch movie details' });
  });
});
