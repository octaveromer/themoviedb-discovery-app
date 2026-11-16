import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LANGUAGE, DEFAULT_REGION } from './constants';
import { fetchDiscoverMovies, fetchMovieDetails } from './tmdb-client';

vi.mock('./config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

/**
 * Creates a fake fetch response returned by TMDB.
 * @param data The JSON body of the response.
 * @param ok Whether the HTTP status is successful.
 * @param status The HTTP status.
 */
function tmdbResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: vi.fn().mockResolvedValue(data) };
}

describe('tmdb-client.ts', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchDiscoverMovies', () => {
    it('requests one page of the movies of a year with the server token', async () => {
      // Arrange
      const page = { page: 2, results: [], total_pages: 5, total_results: 90 };
      fetchMock.mockResolvedValueOnce(tmdbResponse(page));

      // Act
      const result = await fetchDiscoverMovies('2020', 2);

      // Assert
      expect(result).toEqual(page);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=2&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        }),
      );
    });
  });

  describe('fetchMovieDetails', () => {
    it('requests the details of a movie', async () => {
      // Arrange
      const details = { id: 550, runtime: 139, production_countries: [] };
      fetchMock.mockResolvedValueOnce(tmdbResponse(details));

      // Act
      const result = await fetchMovieDetails(550);

      // Assert
      expect(result).toEqual(details);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/550?language=${DEFAULT_LANGUAGE}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        }),
      );
    });

    it('throws an error with the path and the status when TMDB answers with an HTTP error', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(tmdbResponse({}, false, 404));

      // Act & Assert
      await expect(fetchMovieDetails(999)).rejects.toThrow(
        'TMDB API request /movie/999 failed with status 404',
      );
    });

    it('rethrows a network error', async () => {
      // Arrange
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchMovieDetails(550)).rejects.toThrow('Network error');
    });
  });
});
