import type { DatabaseSync } from 'node:sqlite';
import { upsertCountries } from '../database/country-repository.ts';
import { upsertGenres } from '../database/genre-repository.ts';
import {
  replaceMovieCountries,
  replaceMovieGenres,
  upsertMovies,
} from '../database/movie-repository.ts';
import { runInTransaction } from '../database/transaction.ts';
import type {
  Country,
  Genre,
  StoredMovie,
  TmdbMovieFullDetails,
} from '../types/MoviesTypes.ts';
import { isValidYear } from '../utils/discover-query-params.ts';
import {
  fetchDiscoverMovies,
  fetchMovieDetails,
} from '../utils/tmdb-client.ts';

/** Number of movies, genres and countries saved by a synchronization. */
export type SyncResult = {
  movies: number;
  genres: number;
  countries: number;
};

/**
 * Updates the movies of a release year, with their genres and production countries,
 * from the TMDB Discover and movie details APIs.
 * Everything is fetched first, then saved in a single transaction: if a request
 * or a write fails, nothing is saved.
 * @param database The SQLite database to update.
 * @param year The release year, e.g. "2020".
 * @param pageCount The number of Discover pages to read (20 movies per page).
 * @param collectedAt The date and time stored as the collection date of each movie.
 * @returns The number of movies, genres and countries saved.
 * @throws {Error} If the year or the page count is invalid, or if TMDB or the database fails.
 */
export async function syncMoviesByYear(
  database: DatabaseSync,
  year: string,
  pageCount = 1,
  collectedAt = new Date().toISOString(),
): Promise<SyncResult> {
  if (!isValidYear(year)) {
    throw new Error(
      `Invalid year "${year}": expected a year between 1000 and 9999.`,
    );
  }
  if (!Number.isSafeInteger(pageCount) || pageCount < 1) {
    throw new Error(
      `Invalid page count "${pageCount}": expected a positive integer.`,
    );
  }

  const details = await fetchMoviesOfYear(year, pageCount);

  // Gather the genres and countries of every movie, without duplicates
  const genres = new Map<number, Genre>();
  const countries = new Map<string, Country>();
  for (const movie of details) {
    for (const genre of movie.genres) {
      genres.set(genre.id, { id: genre.id, name: genre.name });
    }
    for (const country of movie.production_countries) {
      countries.set(country.iso_3166_1, {
        code: country.iso_3166_1,
        name: country.name,
      });
    }
  }

  // Genres and countries are saved before the movies that refer to them
  runInTransaction(database, () => {
    upsertGenres(database, genres.values());
    upsertCountries(database, countries.values());
    upsertMovies(
      database,
      details.map((movie) => toStoredMovie(movie, collectedAt)),
    );
    for (const movie of details) {
      replaceMovieGenres(
        database,
        movie.id,
        movie.genres.map((genre) => genre.id),
      );
      replaceMovieCountries(
        database,
        movie.id,
        movie.production_countries.map((country) => country.iso_3166_1),
      );
    }
  });

  return {
    movies: details.length,
    genres: genres.size,
    countries: countries.size,
  };
}

/**
 * Fetches the details of the movies found on the first Discover pages of a year.
 * The requests are made one after the other, to stay within the TMDB rate limit.
 * @param year The release year.
 * @param pageCount The maximum number of pages to read.
 * @returns The details of every movie found.
 */
async function fetchMoviesOfYear(
  year: string,
  pageCount: number,
): Promise<TmdbMovieFullDetails[]> {
  const details: TmdbMovieFullDetails[] = [];
  for (let page = 1; page <= pageCount; page++) {
    const discovered = await fetchDiscoverMovies(year, page);
    for (const movie of discovered.results) {
      details.push(await fetchMovieDetails(movie.id));
    }
    // Stop when TMDB has no more pages
    if (page >= discovered.total_pages) {
      break;
    }
  }
  return details;
}

/**
 * Converts the TMDB details of a movie into a row of the movies table.
 * TMDB uses an empty date and 0 for unknown values: they are stored as `null`.
 * @param movie The details returned by TMDB.
 * @param collectedAt The collection date of the movie.
 * @returns The movie to save.
 */
function toStoredMovie(
  movie: TmdbMovieFullDetails,
  collectedAt: string,
): StoredMovie {
  return {
    id: movie.id,
    title: movie.title,
    original_title: movie.original_title,
    original_language: movie.original_language,
    overview: movie.overview,
    release_date: movie.release_date || null,
    popularity: movie.popularity,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    runtime_minutes: movie.runtime || null,
    budget: movie.budget || null,
    revenue: movie.revenue || null,
    collected_at: collectedAt,
  };
}
