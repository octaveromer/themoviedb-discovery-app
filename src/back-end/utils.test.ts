import { describe, expect, it } from 'vitest';
import type { TmdbMovie, TmdbMovieDetails } from './schemas/MoviesTypes';
import {
  tmdbHeaders,
  toSupportedMovie,
  toSupportedMovieDetails,
} from './utils';

const tmdbMovie: TmdbMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [27, 878],
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

describe('toSupportedMovie', () => {
  it('keeps the supported fields and removes adult and video', () => {
    // Act
    const movie = toSupportedMovie(tmdbMovie);

    // Assert
    expect(movie).not.toHaveProperty('adult');
    expect(movie).not.toHaveProperty('video');
    expect(movie).toEqual({
      backdrop_path: '/backdrop.jpg',
      genre_ids: [27, 878],
      id: 42,
      original_language: 'en',
      original_title: 'Resident Evil',
      overview: 'A new era of evil.',
      popularity: 12.5,
      poster_path: '/poster.jpg',
      release_date: '2026-09-18',
      title: 'Resident Evil',
      vote_average: 7.3,
      vote_count: 120,
    });
  });
});

describe('toSupportedMovieDetails', () => {
  it('keeps the supported fields and removes adult, video and production companies', () => {
    // Arrange
    const { genre_ids: _genreIds, ...rest } = tmdbMovie;
    const tmdbMovieDetails: TmdbMovieDetails = {
      ...rest,
      genres: [{ id: 27, name: 'Horror' }],
      tagline: 'A new era of evil.',
      production_companies: [
        { id: 1, logo_path: null, name: 'Studio', origin_country: 'US' },
      ],
    };

    // Act
    const movie = toSupportedMovieDetails(tmdbMovieDetails);

    // Assert
    expect(movie).not.toHaveProperty('adult');
    expect(movie).not.toHaveProperty('video');
    expect(movie).not.toHaveProperty('production_companies');
    expect(movie.genres).toEqual([{ id: 27, name: 'Horror' }]);
    expect(movie.tagline).toBe('A new era of evil.');
    expect(movie.title).toBe('Resident Evil');
  });
});

describe('tmdbHeaders', () => {
  it('builds the authorization and content type headers', () => {
    // Act
    const headers = tmdbHeaders('my-token');

    // Assert
    expect(headers).toEqual({
      Authorization: 'Bearer my-token',
      'Content-Type': 'application/json;charset=utf-8',
    });
  });
});
