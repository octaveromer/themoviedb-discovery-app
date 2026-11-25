import type { Request } from 'express';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';

// A release year is a string of four digits between 1000 and 9999
const YEAR_PATTERN = /^[1-9]\d{3}$/;

/**
 * Checks that a query value is a valid release year.
 * Arrays (`?year=2020&year=2021`) and objects (`?year[a]=2020`) are rejected.
 * @param year The `year` value from the Express request query.
 * @returns `true` if the value is a string of four digits between 1000 and 9999.
 */
export function isValidYear(year: unknown): year is string {
  return typeof year === 'string' && YEAR_PATTERN.test(year);
}

/**
 * Returns the query value if it is a non-empty string, else the default value.
 * @param value The value from the Express request query.
 * @param defaultValue The value used when the query value is missing or not a string.
 * @returns The value to send to TMDB.
 */
function stringOrDefault(value: unknown, defaultValue: string): string {
  return typeof value === 'string' && value !== '' ? value : defaultValue;
}

/**
 * Creates the query parameters of a TMDB Discover request for the movies of a release year.
 * @param year The validated release year.
 * @param query The query parameters from the Express request (language, page, region).
 * @returns The parameters with the year filter and the language, page and region, or their default values.
 */
export function createDiscoverQueryParams(
  year: string,
  query: Request['query'],
): URLSearchParams {
  return new URLSearchParams({
    primary_release_year: year,
    language: stringOrDefault(query.language, DEFAULT_LANGUAGE),
    page: stringOrDefault(query.page, String(DEFAULT_PAGE)),
    region: stringOrDefault(query.region, DEFAULT_REGION),
  });
}
