import { parse } from 'csv-parse/sync';
import type { Country } from '../types/MoviesTypes.ts';

// Columns expected in a countries CSV file, whatever their order or case
const COUNTRY_COLUMNS = ['code', 'name'];

// A country code is made of exactly two uppercase letters (e.g. "FR")
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

/**
 * Parses the content of a countries CSV file.
 * The header must contain exactly the `code` and `name` columns, in any order and case.
 * Empty lines are ignored, spaces around values are removed, LF and CRLF line endings
 * and a UTF-8 BOM are accepted.
 * @param content The content of the CSV file.
 * @returns The countries read from the file, in the file order.
 * @throws {Error} If the header, a value or the CSV syntax is invalid.
 */
export function parseCountriesCsv(content: string): Country[] {
  const records: Record<string, string>[] = parse(content, {
    bom: true,
    columns: normalizeHeader,
    skip_empty_lines: true,
    trim: true,
  });

  // The header line is line 1, so the first record is on line 2
  return records.map((record, index) => toCountry(record, index + 2));
}

/**
 * Checks the CSV header and returns the column names in lower case.
 * @param header The column names read from the first line.
 * @returns The normalized column names.
 */
function normalizeHeader(header: string[]): string[] {
  const columns = header.map((column) => column.toLowerCase());
  const isValid =
    columns.length === COUNTRY_COLUMNS.length &&
    COUNTRY_COLUMNS.every((column) => columns.includes(column));

  if (!isValid) {
    throw new Error(
      `Invalid countries CSV header: expected columns "code" and "name", got "${header.join(',')}".`,
    );
  }
  return columns;
}

/**
 * Converts a CSV record into a country after validating its values.
 * @param record The record with `code` and `name` columns.
 * @param line The line number of the record, used in error messages.
 * @returns The country.
 */
function toCountry(record: Record<string, string>, line: number): Country {
  if (!COUNTRY_CODE_PATTERN.test(record.code)) {
    throw new Error(
      `Invalid country code "${record.code}" on line ${line}: expected two uppercase letters.`,
    );
  }

  if (record.name === '') {
    throw new Error(`Empty country name on line ${line}.`);
  }

  return { code: record.code, name: record.name };
}
