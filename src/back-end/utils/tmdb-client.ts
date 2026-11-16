import type {
  TmdbMovieFullDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';
import { tmdbAccessToken } from './config';
import { DEFAULT_LANGUAGE } from './constants';
import { createDiscoverQueryParams } from './discover-query-params';

// Base URL of the TMDB API, version 3
const TMDB_API_URL = 'https://api.themoviedb.org/3';

/**
 * Calls the TMDB API with the access token of the server and reads the JSON response.
 * @param path The path of the TMDB endpoint, e.g. "/movie/550".
 * @param queryParams The query parameters of the request.
 * @returns The JSON body of the response.
 * @throws {Error} If the request fails or TMDB answers with an HTTP error.
 */
async function fetchTmdb<T>(
  path: string,
  queryParams: URLSearchParams,
): Promise<T> {
  const response = await fetch(
    `${TMDB_API_URL}${path}?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${tmdbAccessToken}`,
        'Content-Type': 'application/json;charset=utf-8',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `TMDB API request ${path} failed with status ${response.status}`,
    );
  }
  return (await response.json()) as T;
}

/**
 * Fetches one page of the movies released in a year, with the TMDB Discover API.
 * @param year The release year, e.g. "2020".
 * @param page The page number, starting at 1.
 * @returns The page of movies returned by TMDB.
 */
export function fetchDiscoverMovies(
  year: string,
  page: number,
): Promise<TmdbMoviesRawResponse> {
  return fetchTmdb(
    '/discover/movie',
    createDiscoverQueryParams(year, { page: String(page) }),
  );
}

/**
 * Fetches the details of a movie: runtime, budget, revenue, genres and production countries.
 * @param movieId The TMDB identifier of the movie.
 * @returns The details returned by TMDB.
 */
export function fetchMovieDetails(
  movieId: number,
): Promise<TmdbMovieFullDetails> {
  return fetchTmdb(
    `/movie/${movieId}`,
    new URLSearchParams({ language: DEFAULT_LANGUAGE }),
  );
}
