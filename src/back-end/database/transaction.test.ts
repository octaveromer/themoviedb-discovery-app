import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runInTransaction } from './transaction.ts';

describe('transaction.ts', () => {
  let database: DatabaseSync;

  /** Inserts a value in the test table. */
  const insert = (value: string) =>
    database.prepare('INSERT INTO items (value) VALUES (?)').run(value);

  /** Reads the values of the test table. */
  const readValues = () =>
    database
      .prepare('SELECT value FROM items ORDER BY value')
      .all()
      .map((row) => row.value);

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    database.exec('CREATE TABLE items (value TEXT NOT NULL)');
  });

  afterEach(() => {
    database.close();
  });

  describe('runInTransaction', () => {
    it('saves the changes and returns the value of the function', () => {
      // Act
      const result = runInTransaction(database, () => {
        insert('a');
        insert('b');
        return 'done';
      });

      // Assert
      expect(result).toBe('done');
      expect(readValues()).toEqual(['a', 'b']);
      expect(database.isTransaction).toBe(false);
    });

    it('cancels every change and rethrows when the function throws', () => {
      // Act & Assert
      expect(() =>
        runInTransaction(database, () => {
          insert('a');
          throw new Error('failure');
        }),
      ).toThrow('failure');

      // Assert: nothing is saved and the transaction is closed
      expect(readValues()).toEqual([]);
      expect(database.isTransaction).toBe(false);
    });

    it('saves nested changes only when the outer transaction succeeds', () => {
      // Act & Assert: the inner call succeeds, then the outer one fails
      expect(() =>
        runInTransaction(database, () => {
          insert('a');
          runInTransaction(database, () => insert('b'));
          throw new Error('outer failure');
        }),
      ).toThrow('outer failure');

      // Assert: the inner changes are cancelled too
      expect(readValues()).toEqual([]);
    });

    it('keeps the outer changes when a nested call fails and its error is caught', () => {
      // Act
      runInTransaction(database, () => {
        insert('a');
        try {
          runInTransaction(database, () => {
            insert('b');
            throw new Error('inner failure');
          });
        } catch {
          // The outer function decides to go on without the inner changes
        }
      });

      // Assert
      expect(readValues()).toEqual(['a']);
    });
  });
});
