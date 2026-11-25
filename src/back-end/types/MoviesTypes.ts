// TypeScript type for the raw response from the TMDB API for popular movies.
export type TmdbMoviesRawResponse = {
  page: number;
  results: Array<TmdbMovie & { video?: boolean }>;
  total_pages: number;
  total_results: number;
};

// TypeScript type for the raw response from the TMDB API for popular movies.
export type TmdbMovie = {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

// TypeScript type for a movie genre, identified by its TMDB numeric id.
export type Genre = {
  id: number;
  name: string;
};

// TypeScript type for a production country, identified by its ISO 3166-1 code (e.g. "FR").
export type Country = {
  code: string;
  name: string;
};

// TypeScript type for a movie stored in the SQLite `movies` table.
// The release year is not included: the database computes it from `release_date`.
export type StoredMovie = {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  // Release date in the 'YYYY-MM-DD' format
  release_date: string | null;
  popularity: number | null;
  vote_average: number | null;
  vote_count: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime_minutes: number | null;
  budget: number | null;
  revenue: number | null;
  // Date and time when the movie data was collected, in the ISO 8601 format
  collected_at: string;
};

export type TmdbMovieDetails = {
  adult: boolean;
  backdrop_path: string | null;
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  tagline: string | null;
  production_companies: Array<{
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }>;
};

// TypeScript type for the movie details returned by TMDB with the fields needed to
// fill the database: runtime, budget, revenue and production countries.
export type TmdbMovieFullDetails = TmdbMovieDetails & {
  runtime: number | null;
  budget: number;
  revenue: number;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
};

// TypeScript type for the API response when fetching movies, containing an array of supported Movie objects.
export type MoviesApiResponse = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
};

// TypeScript type for the supported movie format used in our application, omitting 'adult' and 'video' properties from the TmdbMovie type.
export type Movie = Omit<TmdbMovie, 'adult' | 'video'>;

// TypeScript type for the supported movie details format used in our application, omitting 'adult','video' and production_companies properties from the TmdbMovieDetails type.
export type MovieDetails = Omit<
  TmdbMovieDetails,
  'adult' | 'video' | 'production_companies'
>;

// TypeScript type for the API response when fetching popular movies, containing an array of supported Movie objects.
export type ApiErrorResponse = {
  error: string;
};
