import { describe, expect, it } from 'vitest';
import { parseGenresCsv } from './genres-csv.ts';

describe('genres-csv.ts', () => {
  describe('parseGenresCsv', () => {
    it('reads the genres of a simple CSV file', () => {
      // Arrange
      const content = 'id,name\n28,Action\n18,Drama\n';

      // Act & Assert
      expect(parseGenresCsv(content)).toEqual([
        { id: 28, name: 'Action' },
        { id: 18, name: 'Drama' },
      ]);
    });

    it('accepts the columns in any order and case', () => {
      expect(parseGenresCsv('NAME,Id\nAction,28\n')).toEqual([
        { id: 28, name: 'Action' },
      ]);
    });

    it('accepts CRLF line endings, a UTF-8 BOM and ignores empty lines', () => {
      // Arrange
      const content = '﻿id,name\r\n28,Action\r\n\r\n18,Drama\r\n\r\n';

      // Act & Assert
      expect(parseGenresCsv(content)).toEqual([
        { id: 28, name: 'Action' },
        { id: 18, name: 'Drama' },
      ]);
    });

    it('reads quoted names containing commas and escaped quotes', () => {
      // Arrange: inside quotes, a doubled quote stands for one quote
      const content = 'id,name\n10770,"Science, ""Fiction"""\n';

      // Act & Assert
      expect(parseGenresCsv(content)).toEqual([
        { id: 10770, name: 'Science, "Fiction"' },
      ]);
    });

    it('returns an empty list when the file only has a header', () => {
      expect(parseGenresCsv('id,name\n')).toEqual([]);
    });

    it.each([
      ['a missing column', 'id\n28\n'],
      ['an unknown column', 'id,label\n28,Action\n'],
      ['an extra column', 'id,name,slug\n28,Action,action\n'],
      ['a duplicated column', 'id,id\n28,28\n'],
    ])('rejects a header with %s', (_case, content) => {
      expect(() => parseGenresCsv(content)).toThrow(
        /Invalid genres CSV header/,
      );
    });

    it.each([
      ['zero', '0'],
      ['a negative number', '-5'],
      ['a decimal number', '12.5'],
      ['an exponent', '1e3'],
      ['text', 'abc'],
      ['an empty value', ''],
      ['a number too large to be exact', '9007199254740993'],
    ])('rejects %s as identifier', (_case, id) => {
      expect(() => parseGenresCsv(`id,name\n${id},Action\n`)).toThrow(
        `Invalid genre id "${id}" on line 2: expected a positive integer.`,
      );
    });

    it('rejects an empty or blank name', () => {
      expect(() => parseGenresCsv('id,name\n28,Action\n18,  \n')).toThrow(
        'Empty genre name on line 3.',
      );
    });

    it.each([
      ['an unclosed quote', 'id,name\n28,"Action\n'],
      ['a quote inside an unquoted field', 'id,name\n28,Act"ion"\n'],
      ['a record with too many fields', 'id,name\n28,Action,extra\n'],
    ])('rejects a CSV with %s', (_case, content) => {
      expect(() => parseGenresCsv(content)).toThrow();
    });
  });
});
