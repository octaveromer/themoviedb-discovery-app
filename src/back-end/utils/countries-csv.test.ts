import { describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './countries-csv.ts';

describe('countries-csv.ts', () => {
  describe('parseCountriesCsv', () => {
    it('reads the countries of a simple CSV file', () => {
      // Arrange
      const content = 'code,name\nFR,France\nUS,United States of America\n';

      // Act & Assert
      expect(parseCountriesCsv(content)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'US', name: 'United States of America' },
      ]);
    });

    it('accepts the columns in any order and case', () => {
      expect(parseCountriesCsv('NAME,Code\nFrance,FR\n')).toEqual([
        { code: 'FR', name: 'France' },
      ]);
    });

    it('accepts CRLF line endings, a UTF-8 BOM and ignores empty lines', () => {
      // Arrange
      const content = '﻿code,name\r\nFR,France\r\n\r\nGB,United Kingdom\r\n';

      // Act & Assert
      expect(parseCountriesCsv(content)).toEqual([
        { code: 'FR', name: 'France' },
        { code: 'GB', name: 'United Kingdom' },
      ]);
    });

    it('removes the spaces around the header and the values', () => {
      expect(parseCountriesCsv(' code , name \n FR ,  France \n')).toEqual([
        { code: 'FR', name: 'France' },
      ]);
    });

    it('reads quoted names containing commas and escaped quotes', () => {
      // Arrange: inside quotes, a doubled quote stands for one quote
      const content = 'code,name\nKR,"Korea, Republic of ""South"""\n';

      // Act & Assert
      expect(parseCountriesCsv(content)).toEqual([
        { code: 'KR', name: 'Korea, Republic of "South"' },
      ]);
    });

    it('returns an empty list when the file only has a header', () => {
      expect(parseCountriesCsv('code,name\n')).toEqual([]);
    });

    it.each([
      ['a missing column', 'code\nFR\n'],
      ['an unknown column', 'code,label\nFR,France\n'],
      ['an extra column', 'code,name,flag\nFR,France,fr.png\n'],
      ['a duplicated column', 'code,code\nFR,FR\n'],
    ])('rejects a header with %s', (_case, content) => {
      expect(() => parseCountriesCsv(content)).toThrow(
        /Invalid countries CSV header/,
      );
    });

    it.each([
      ['lowercase letters', 'fr'],
      ['three letters', 'FRA'],
      ['one letter', 'F'],
      ['digits', '12'],
      ['an empty value', ''],
    ])('rejects a code with %s', (_case, code) => {
      expect(() => parseCountriesCsv(`code,name\n${code},France\n`)).toThrow(
        `Invalid country code "${code}" on line 2: expected two uppercase letters.`,
      );
    });

    it('rejects an empty or blank name', () => {
      expect(() => parseCountriesCsv('code,name\nFR,France\nGB,   \n')).toThrow(
        'Empty country name on line 3.',
      );
    });

    it.each([
      ['an unclosed quote', 'code,name\nFR,"France\n'],
      ['a quote inside an unquoted field', 'code,name\nFR,Fra"nce"\n'],
      ['a record with too many fields', 'code,name\nFR,France,extra\n'],
    ])('rejects a CSV with %s', (_case, content) => {
      expect(() => parseCountriesCsv(content)).toThrow();
    });
  });
});
