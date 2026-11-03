import { parse } from 'csv-parse/sync';
import type { Genre } from '../types/MoviesTypes.ts';

// Columns expected in a genres CSV file, whatever their order or case
const GENRE_COLUMNS = ['id', 'name'];

/**
 * Parses the content of a genres CSV file.
 * The header must contain exactly the `id` and `name` columns, in any order and case.
 * Empty lines are ignored, LF and CRLF line endings and a UTF-8 BOM are accepted.
 * @param content The content of the CSV file.
 * @returns The genres read from the file, in the file order.
 * @throws {Error} If the header, a value or the CSV syntax is invalid.
 */
export function parseGenresCsv(content: string): Genre[] {
  const records: Record<string, string>[] = parse(content, {
    bom: true,
    columns: normalizeHeader,
    skip_empty_lines: true,
  });

  // The header line is line 1, so the first record is on line 2
  return records.map((record, index) => toGenre(record, index + 2));
}

/**
 * Checks the CSV header and returns the column names in lower case.
 * @param header The column names read from the first line.
 * @returns The normalized column names.
 */
function normalizeHeader(header: string[]): string[] {
  const columns = header.map((column) => column.trim().toLowerCase());
  const isValid =
    columns.length === GENRE_COLUMNS.length &&
    GENRE_COLUMNS.every((column) => columns.includes(column));

  if (!isValid) {
    throw new Error(
      `Invalid genres CSV header: expected columns "id" and "name", got "${header.join(',')}".`,
    );
  }
  return columns;
}

/**
 * Converts a CSV record into a genre after validating its values.
 * @param record The record with `id` and `name` columns.
 * @param line The line number of the record, used in error messages.
 * @returns The genre.
 */
function toGenre(record: Record<string, string>, line: number): Genre {
  const id = Number(record.id);
  // Only plain digits are accepted, to reject values like "1e3", "0x1A" or "12.5"
  if (!/^\d+$/.test(record.id) || id <= 0 || !Number.isSafeInteger(id)) {
    throw new Error(
      `Invalid genre id "${record.id}" on line ${line}: expected a positive integer.`,
    );
  }

  const name = record.name.trim();
  if (name === '') {
    throw new Error(`Empty genre name on line ${line}.`);
  }

  return { id, name };
}
