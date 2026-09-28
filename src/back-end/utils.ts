import type { Movie, TmdbMoviesRawResponse } from './schemas/MoviesTypes';

export const toSupportedMovie = (
  movie: TmdbMoviesRawResponse['results'][number],
): Movie => ({
  backdrop_path: movie.backdrop_path,
  genre_ids: movie.genre_ids,
  id: movie.id,
  original_language: movie.original_language,
  original_title: movie.original_title,
  overview: movie.overview,
  popularity: movie.popularity,
  poster_path: movie.poster_path,
  release_date: movie.release_date,
  title: movie.title,
  vote_average: movie.vote_average,
  vote_count: movie.vote_count,
});

export const tmdbHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json;charset=utf-8',
});
