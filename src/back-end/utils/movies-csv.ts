import { parse } from 'csv-parse/sync';
import type { StoredMovie } from '../types/MoviesTypes.ts';

// Columns expected in a movies CSV file, whatever their order or case.
// The genres and production_countries columns are accepted but not read:
// the links between movies, genres and countries are not imported.
const MOVIE_CSV_COLUMNS = [
  'id',
  'title',
  'original_title',
  'original_language',
  'overview',
  'release_date',
  'popularity',
  'vote_average',
  'vote_count',
  'poster_path',
  'backdrop_path',
  'runtime',
  'budget',
  'revenue',
  'genres',
  'production_countries',
];

/**
 * Parses the content of a movies CSV file.
 * The header must contain exactly the expected columns, in any order and case.
 * Empty lines are ignored, spaces around values are removed, LF and CRLF line endings
 * and a UTF-8 BOM are accepted. Empty optional values are converted to `null`.
 * @param content The content of the CSV file.
 * @param collectedAt The date and time of the import, stored in each movie.
 * @returns The movies read from the file, in the file order.
 * @throws {Error} If the header, a value or the CSV syntax is invalid.
 */
export function parseMoviesCsv(
  content: string,
  collectedAt: string,
): StoredMovie[] {
  const records: Record<string, string>[] = parse(content, {
    bom: true,
    columns: normalizeHeader,
    skip_empty_lines: true,
    trim: true,
  });

  // The header line is line 1, so the first record is on line 2
  return records.map((record, index) =>
    toStoredMovie(record, index + 2, collectedAt),
  );
}

/**
 * Checks the CSV header and returns the column names in lower case.
 * @param header The column names read from the first line.
 * @returns The normalized column names.
 */
function normalizeHeader(header: string[]): string[] {
  const columns = header.map((column) => column.toLowerCase());
  const isValid =
    columns.length === MOVIE_CSV_COLUMNS.length &&
    MOVIE_CSV_COLUMNS.every((column) => columns.includes(column));

  if (!isValid) {
    throw new Error(
      `Invalid movies CSV header: expected columns "${MOVIE_CSV_COLUMNS.join(',')}", got "${header.join(',')}".`,
    );
  }
  return columns;
}

/**
 * Converts a CSV record into a movie after validating its values.
 * @param record The record with the expected columns.
 * @param line The line number of the record, used in error messages.
 * @param collectedAt The date and time of the import.
 * @returns The movie.
 */
function toStoredMovie(
  record: Record<string, string>,
  line: number,
  collectedAt: string,
): StoredMovie {
  // Reads a column and reports the line and the column in case of error
  const read = <T>(column: string, convert: (value: string) => T): T => {
    try {
      return convert(record[column]);
    } catch (error) {
      throw new Error(
        `Invalid value "${record[column]}" for "${column}" on line ${line}: ${(error as Error).message}`,
      );
    }
  };

  return {
    id: read('id', toPositiveInteger),
    title: read('title', toRequiredText),
    original_title: read('original_title', toRequiredText),
    original_language: read('original_language', toRequiredText),
    // The overview is required by the table but may be empty
    overview: record.overview,
    release_date: read('release_date', toOptionalDate),
    popularity: read('popularity', toOptionalNumber),
    vote_average: read('vote_average', toOptionalNumber),
    vote_count: read('vote_count', (value) =>
      value === '' ? null : toNonNegativeInteger(value),
    ),
    poster_path: toOptionalText(record.poster_path),
    backdrop_path: toOptionalText(record.backdrop_path),
    runtime_minutes: read('runtime', toOptionalAmount),
    budget: read('budget', toOptionalAmount),
    revenue: read('revenue', toOptionalAmount),
    collected_at: collectedAt,
  };
}

/** Converts a value made only of digits into a safe integer. */
function toNonNegativeInteger(value: string): number {
  // Only plain digits are accepted, to reject values like "1e3", "0x1A" or "12.5"
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number)) {
    throw new Error('expected an integer.');
  }
  return number;
}

/** Converts a value into a positive integer, such as an identifier. */
function toPositiveInteger(value: string): number {
  const number = toNonNegativeInteger(value);
  if (number === 0) {
    throw new Error('expected a positive integer.');
  }
  return number;
}

/**
 * Converts a runtime, budget or revenue into a positive integer.
 * TMDB uses 0 for an unknown amount, so 0 and an empty value become `null`.
 */
function toOptionalAmount(value: string): number | null {
  if (value === '') {
    return null;
  }
  const number = toNonNegativeInteger(value);
  return number === 0 ? null : number;
}

/** Converts a value into a positive or zero decimal number, or `null` if empty. */
function toOptionalNumber(value: string): number | null {
  if (value === '') {
    return null;
  }
  const number = Number(value);
  if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(number)) {
    throw new Error('expected a positive number.');
  }
  return number;
}

/** Checks that a date is in the 'YYYY-MM-DD' format, or returns `null` if empty. */
function toOptionalDate(value: string): string | null {
  if (value === '') {
    return null;
  }
  // The date must have the expected format and exist in the calendar
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('expected a date in the YYYY-MM-DD format.');
  }
  return value;
}

/** Checks that a text is not empty. */
function toRequiredText(value: string): string {
  if (value === '') {
    throw new Error('expected a non-empty value.');
  }
  return value;
}

/** Returns the text, or `null` if it is empty. */
function toOptionalText(value: string): string | null {
  return value === '' ? null : value;
}
