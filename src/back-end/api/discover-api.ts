import type { Express, Request, Response } from 'express';
import { tmdbAccessToken } from '../utils/config';
import { toSupportedMovie } from '../utils/converter';
import {
  createDiscoverQueryParams,
  isValidYear,
} from '../utils/discover-query-params';
import type {
  MoviesApiResponse,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

/**
 * Registers the Discover API route, which lists the movies of a release year
 * using the TMDB Discover API. Each call returns a single page of results.
 * @param app - The Express application instance to register the route on.
 */
export function registerDiscoverApi(app: Express): void {
  app.get('/api/discover/movies', async (req: Request, res: Response) => {
    const { year } = req.query;

    // Reject an invalid year before calling TMDB
    if (!isValidYear(year)) {
      res.status(400).json({
        error:
          'The "year" query parameter is required and must be a year between 1000 and 9999.',
      });
      return;
    }

    try {
      const queryParams = createDiscoverQueryParams(year, req.query);
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `TMDB API request failed with status ${response.status}`,
        );
      }

      const rawData = (await response.json()) as TmdbMoviesRawResponse;

      // Keep the pagination and convert each movie to the supported format
      const data: MoviesApiResponse = {
        page: rawData.page,
        results: rawData.results.map(toSupportedMovie),
        total_pages: rawData.total_pages,
        total_results: rawData.total_results,
      };
      res.json(data);
    } catch (error) {
      console.error(`Error discovering movies for year ${year}:`, error);
      res.status(500).json({ error: 'Failed to discover movies' });
    }
  });
}
