import { describe, expect, it } from 'vitest';
import {
  createDiscoverQueryParams,
  isValidYear,
} from './discover-query-params';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE, DEFAULT_REGION } from './constants';

describe('discover-query-params.ts', () => {
  describe('isValidYear', () => {
    it.each(['1000', '1999', '2020', '9999'])('accepts %s', (year) => {
      expect(isValidYear(year)).toBe(true);
    });

    it.each([
      ['a missing value', undefined],
      ['an empty string', ''],
      ['a year below 1000', '0999'],
      ['three digits', '999'],
      ['five digits', '20200'],
      ['text', 'abcd'],
      ['a year with spaces', ' 2020'],
      ['a number instead of a string', 2020],
      ['several values', ['2020', '2021']],
      ['a structured value', { from: '2020' }],
    ])('rejects %s', (_case, year) => {
      expect(isValidYear(year)).toBe(false);
    });
  });

  describe('createDiscoverQueryParams', () => {
    it('adds the year filter and the default options', () => {
      // Act
      const params = createDiscoverQueryParams('2020', {});

      // Assert
      expect(params.toString()).toBe(
        `primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
      );
    });

    it('uses the language, page and region given in the query', () => {
      // Act
      const params = createDiscoverQueryParams('2020', {
        language: 'en-US',
        page: '2',
        region: 'US',
      });

      // Assert
      expect(params.toString()).toBe(
        'primary_release_year=2020&language=en-US&page=2&region=US',
      );
    });

    it('uses the default options for empty or non-string values', () => {
      // Act: empty string, several values and structured value
      const params = createDiscoverQueryParams('2020', {
        language: '',
        page: ['2', '3'],
        region: { code: 'US' },
      });

      // Assert
      expect(params.toString()).toBe(
        `primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
      );
    });
  });
});
