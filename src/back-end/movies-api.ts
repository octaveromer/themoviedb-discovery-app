import type { Request, Response, Router } from 'express';
import express from 'express';
import { getTmdbAccessToken } from './config';
import type {
  MoviesApiResponse,
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from './schemas/MoviesTypes';
import { tmdbHeaders, toSupportedMovie } from './utils';

const moviesRouter: Router = express.Router();

moviesRouter.get(
  '/popular',
  async (_request: Request, response: Response): Promise<void> => {
    try {
      const tmdbResponse = await fetch(
        'https://api.themoviedb.org/3/movie/popular?language=fr-FR&region=FR',
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

      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?language=fr-FR`,
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
      response.json({ ...toSupportedMovie(movie), ...movie });
    } catch (error) {
      console.error('Error fetching movie details:', error);
      response.status(500).json({ error: 'Failed to fetch movie details' });
    }
  },
);

export default moviesRouter;
