import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TmdbMovie, TmdbMoviesRawResponse } from '../types/MoviesTypes';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { registerDiscoverApi } from './discover-api';

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

// Fake Express application that keeps the registered route handlers
const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

/**
 * Calls the Discover route handler with the given query parameters.
 * @param query The query parameters of the request.
 * @returns The fake response, to check its status and JSON body.
 */
async function callDiscoverRoute(query: Request['query']) {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  const handler = handlers.get('/api/discover/movies') as RouteHandler;
  await handler({ query } as Request, response as unknown as Response, vi.fn());
  return response;
}

/**
 * Creates a fake fetch response returned by TMDB.
 * @param data The JSON body of the response.
 * @param ok Whether the HTTP status is successful.
 * @param status The HTTP status.
 */
function tmdbResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: vi.fn().mockResolvedValue(data) };
}

const tmdbMovie: TmdbMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18],
  id: 496243,
  original_language: 'ko',
  original_title: '기생충',
  overview: 'A poor family schemes to become employed by a wealthy family.',
  popularity: 95.5,
  poster_path: '/poster.jpg',
  release_date: '2020-02-07',
  title: 'Parasite',
  video: false,
  vote_average: 8.5,
  vote_count: 18000,
};

describe('discover API', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handlers.clear();
    registerDiscoverApi(app);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET /api/discover/movies', () => {
    it('returns the converted movies of the year with the default options', async () => {
      // Arrange
      const rawData: TmdbMoviesRawResponse = {
        page: 1,
        results: [tmdbMovie],
        total_pages: 12,
        total_results: 230,
      };
      fetchMock.mockResolvedValueOnce(tmdbResponse(rawData));

      // Act
      const response = await callDiscoverRoute({ year: '2020' });

      // Assert: the year filter, the default options and the server token are sent to TMDB
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        }),
      );

      // Assert: the pagination is kept and adult and video are removed from each movie
      const { adult: _adult, video: _video, ...supportedMovie } = tmdbMovie;
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [supportedMovie],
        total_pages: 12,
        total_results: 230,
      });
      expect(JSON.stringify(response.json.mock.calls)).not.toContain(
        'test-access-token',
      );
    });

    it('sends the language, page and region given in the query', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(
        tmdbResponse({
          page: 2,
          results: [],
          total_pages: 12,
          total_results: 230,
        }),
      );

      // Act
      await callDiscoverRoute({
        year: '2020',
        language: 'en-US',
        page: '2',
        region: 'US',
      });

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=en-US&page=2&region=US',
        expect.anything(),
      );
    });

    it('returns an empty list with the TMDB pagination when there is no movie', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(
        tmdbResponse({
          page: 1,
          results: [],
          total_pages: 0,
          total_results: 0,
        }),
      );

      // Act
      const response = await callDiscoverRoute({ year: '1000' });

      // Assert
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
    });

    it.each([
      ['missing', {}],
      ['invalid', { year: '20' }],
      ['given several times', { year: ['2020', '2021'] }],
      ['structured', { year: { from: '2020' } }],
    ])(
      'returns HTTP 400 without calling TMDB when the year is %s',
      async (_case, query) => {
        // Act
        const response = await callDiscoverRoute(query);

        // Assert
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          error:
            'The "year" query parameter is required and must be a year between 1000 and 9999.',
        });
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it.each([
      [
        'an HTTP error',
        () => fetchMock.mockResolvedValueOnce(tmdbResponse({}, false, 503)),
      ],
      [
        'a network error',
        () => fetchMock.mockRejectedValueOnce(new Error('Network error')),
      ],
      [
        'an invalid JSON body',
        () =>
          fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi
              .fn()
              .mockRejectedValue(new SyntaxError('Unexpected token')),
          }),
      ],
    ])('logs %s and returns HTTP 500', async (_case, arrangeFetch) => {
      // Arrange
      arrangeFetch();

      // Act
      const response = await callDiscoverRoute({ year: '2020' });

      // Assert
      expect(errorSpy).toHaveBeenCalledWith(
        'Error discovering movies for year 2020:',
        expect.any(Error),
      );
      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Failed to discover movies',
      });
    });
  });
});
