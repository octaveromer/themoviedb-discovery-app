import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { StoredMovie } from '../types/MoviesTypes.ts';
import { parseMoviesCsv } from './movies-csv.ts';

const HEADER =
  'id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime,budget,revenue,genres,production_countries';

const COLLECTED_AT = '2026-11-16T10:00:00.000Z';

// Values of a complete CSV line, in the HEADER order
const CREED_III: Record<string, string> = {
  id: '677179',
  title: 'Creed III',
  original_title: 'Creed III',
  original_language: 'en',
  overview: 'Adonis Creed faces his past.',
  release_date: '2023-03-01',
  popularity: '2865.256',
  vote_average: '7.3',
  vote_count: '1183',
  poster_path: '/creed-poster.jpg',
  backdrop_path: '/creed-backdrop.jpg',
  runtime: '116',
  budget: '75000000',
  revenue: '275300000',
  genres: '"[18,28]"',
  production_countries:
    '"[{""iso_3166_1"":""US"",""name"":""United States""}]"',
};

const CREED_III_MOVIE: StoredMovie = {
  id: 677179,
  title: 'Creed III',
  original_title: 'Creed III',
  original_language: 'en',
  overview: 'Adonis Creed faces his past.',
  release_date: '2023-03-01',
  popularity: 2865.256,
  vote_average: 7.3,
  vote_count: 1183,
  poster_path: '/creed-poster.jpg',
  backdrop_path: '/creed-backdrop.jpg',
  runtime_minutes: 116,
  budget: 75000000,
  revenue: 275300000,
  collected_at: COLLECTED_AT,
};

/**
 * Builds a CSV line from the Creed III values, with some values replaced.
 * @param changes The values to replace.
 * @returns The CSV line, in the HEADER order.
 */
function csvLine(changes: Record<string, string> = {}): string {
  const values = { ...CREED_III, ...changes };
  return HEADER.split(',')
    .map((column) => values[column])
    .join(',');
}

describe('movies-csv.ts', () => {
  describe('parseMoviesCsv', () => {
    it('reads the movies of a CSV file', () => {
      // Act
      const movies = parseMoviesCsv(`${HEADER}\n${csvLine()}\n`, COLLECTED_AT);

      // Assert: the runtime column is stored as runtime_minutes
      expect(movies).toEqual([CREED_III_MOVIE]);
    });

    it('reads every movie of the example file data/movies.csv', () => {
      // Act
      const movies = parseMoviesCsv(
        readFileSync('data/movies.csv', 'utf8'),
        COLLECTED_AT,
      );

      // Assert
      expect(movies).toHaveLength(10);
      expect(movies[0]).toMatchObject({
        id: 640146,
        title: 'Ant-Man and the Wasp: Quantumania',
        release_date: '2023-02-15',
        runtime_minutes: 125,
      });
    });

    it('converts empty optional values to null', () => {
      // Arrange
      const line = csvLine({
        overview: '',
        release_date: '',
        popularity: '',
        vote_average: '',
        vote_count: '',
        poster_path: '',
        backdrop_path: '',
        runtime: '',
        budget: '',
        revenue: '',
      });

      // Act & Assert: the overview stays an empty string
      expect(parseMoviesCsv(`${HEADER}\n${line}\n`, COLLECTED_AT)).toEqual([
        {
          ...CREED_III_MOVIE,
          overview: '',
          release_date: null,
          popularity: null,
          vote_average: null,
          vote_count: null,
          poster_path: null,
          backdrop_path: null,
          runtime_minutes: null,
          budget: null,
          revenue: null,
        },
      ]);
    });

    it('converts a runtime, budget or revenue of 0 to null', () => {
      // Arrange: TMDB uses 0 for an unknown amount
      const line = csvLine({ runtime: '0', budget: '0', revenue: '0' });

      // Act & Assert
      expect(parseMoviesCsv(`${HEADER}\n${line}\n`, COLLECTED_AT)).toEqual([
        {
          ...CREED_III_MOVIE,
          runtime_minutes: null,
          budget: null,
          revenue: null,
        },
      ]);
    });

    it('accepts the columns in any order and case, CRLF, a BOM, spaces and empty lines', () => {
      // Arrange: the header is reversed and in upper case
      const columns = HEADER.split(',').reverse();
      const header = columns.map((column) => column.toUpperCase()).join(',');
      const line = columns.map((column) => ` ${CREED_III[column]} `).join(',');
      const content = `﻿${header}\r\n\r\n${line}\r\n\r\n`;

      // Act & Assert
      expect(parseMoviesCsv(content, COLLECTED_AT)).toEqual([CREED_III_MOVIE]);
    });

    it('reads quoted titles containing commas and escaped quotes', () => {
      // Arrange
      const line = csvLine({ title: '"Shazam!, ""Fury"" of the Gods"' });

      // Act & Assert
      expect(parseMoviesCsv(`${HEADER}\n${line}\n`, COLLECTED_AT)).toEqual([
        { ...CREED_III_MOVIE, title: 'Shazam!, "Fury" of the Gods' },
      ]);
    });

    it('returns an empty list when the file only has a header', () => {
      expect(parseMoviesCsv(`${HEADER}\n`, COLLECTED_AT)).toEqual([]);
    });

    it.each([
      ['a missing column', HEADER.replace(',revenue', '')],
      ['an unknown column', HEADER.replace('revenue', 'income')],
      ['an extra column', `${HEADER},tagline`],
    ])('rejects a header with %s', (_case, header) => {
      expect(() => parseMoviesCsv(`${header}\n`, COLLECTED_AT)).toThrow(
        /Invalid movies CSV header/,
      );
    });

    it.each([
      ['id', '0', 'expected a positive integer.'],
      ['id', '-5', 'expected an integer.'],
      ['id', '12.5', 'expected an integer.'],
      ['id', '', 'expected an integer.'],
      ['title', '', 'expected a non-empty value.'],
      ['original_title', '', 'expected a non-empty value.'],
      ['original_language', '', 'expected a non-empty value.'],
      [
        'release_date',
        '2023/03/01',
        'expected a date in the YYYY-MM-DD format.',
      ],
      [
        'release_date',
        '2023-02-30',
        'expected a date in the YYYY-MM-DD format.',
      ],
      ['popularity', 'high', 'expected a positive number.'],
      ['vote_average', '-1', 'expected a positive number.'],
      ['vote_count', '1e3', 'expected an integer.'],
      ['runtime', '1h56', 'expected an integer.'],
      ['budget', '9007199254740993', 'expected an integer.'],
      ['revenue', '-100', 'expected an integer.'],
    ])('rejects the value "%s" = "%s"', (column, value, reason) => {
      // Arrange
      const line = csvLine({ [column]: value });

      // Act & Assert: the error gives the value, the column and the line
      expect(() =>
        parseMoviesCsv(`${HEADER}\n${line}\n`, COLLECTED_AT),
      ).toThrow(
        `Invalid value "${value}" for "${column}" on line 2: ${reason}`,
      );
    });

    it.each([
      ['an unclosed quote', csvLine({ title: '"Creed III' })],
      ['a quote inside an unquoted field', csvLine({ title: 'Creed "III"' })],
      ['a record with too many fields', `${csvLine()},extra`],
    ])('rejects a CSV with %s', (_case, line) => {
      expect(() =>
        parseMoviesCsv(`${HEADER}\n${line}\n`, COLLECTED_AT),
      ).toThrow();
    });
  });
});
