import type { Request, Response, Router } from 'express';
import express from 'express';
import { getTmdbAccessToken } from './config';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';
import type {
  MoviesApiResponse,
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from './schemas/MoviesTypes';
import {
  tmdbHeaders,
  toSupportedMovie,
  toSupportedMovieDetails,
} from './utils';

const moviesRouter: Router = express.Router();

// Fetch popular movies from TMDB API, using language, page and region query params
moviesRouter.get(
  '/popular',
  async (request: Request, response: Response): Promise<void> => {
    try {
      const { language, page, region } = request.query;
      const queryParams = new URLSearchParams({
        language: (language as string) || DEFAULT_LANGUAGE,
        page: (page as string) || DEFAULT_PAGE,
        region: (region as string) || DEFAULT_REGION,
      });

      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?${queryParams.toString()}`,
        { headers: tmdbHeaders(getTmdbAccessToken()) },
      );

      if (!tmdbResponse.ok) {
        throw new Error(
          `TMDB API request failed with status ${tmdbResponse.status}`,
        );
      }

      const rawData = (await tmdbResponse.json()) as TmdbMoviesRawResponse;
      const data: MoviesApiResponse = {
        page: rawData.page,
        results: rawData.results.map(toSupportedMovie),
        total_pages: rawData.total_pages,
        total_results: rawData.total_results,
      };

      response.json(data);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      response.status(500).json({ error: 'Failed to fetch popular movies' });
    }
  },
);

// Fetch the details of a movie from TMDB API by its identifier
moviesRouter.get(
  '/:id',
  async (request: Request, response: Response): Promise<void> => {
    try {
      const movieId = Number(request.params.id);
      if (!Number.isInteger(movieId) || movieId <= 0) {
        response
          .status(400)
          .json({ error: 'Movie id must be a positive integer' });
        return;
      }

      const { language } = request.query;
      const queryParams = new URLSearchParams({
        language: (language as string) || DEFAULT_LANGUAGE,
      });

      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?${queryParams.toString()}`,
        { headers: tmdbHeaders(getTmdbAccessToken()) },
      );

      if (!tmdbResponse.ok) {
        if (tmdbResponse.status === 404) {
          response.status(404).json({ error: 'Movie not found' });
          return;
        }
        throw new Error(
          `TMDB API request failed with status ${tmdbResponse.status}`,
        );
      }

      const movie = (await tmdbResponse.json()) as TmdbMovieDetails;
      response.json(toSupportedMovieDetails(movie));
    } catch (error) {
      console.error('Error fetching movie details:', error);
      response.status(500).json({ error: 'Failed to fetch movie details' });
    }
  },
);

export default moviesRouter;
