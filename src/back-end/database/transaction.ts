import type { DatabaseSync } from 'node:sqlite';

// Name of the SQLite savepoint used by runInTransaction
const SAVEPOINT = 'run_in_transaction';

/**
 * Runs a function in a transaction: all its changes are saved, or none if it throws.
 * A savepoint is used instead of BEGIN/COMMIT, so that a call can be nested in another
 * one: the inner changes are then only saved when the outer transaction succeeds.
 * @param database The SQLite database to update.
 * @param work The function that makes the changes.
 * @returns The value returned by the function.
 * @throws The error thrown by the function, after cancelling its changes.
 */
export function runInTransaction<T>(database: DatabaseSync, work: () => T): T {
  database.exec(`SAVEPOINT ${SAVEPOINT};`);
  try {
    const result = work();
    database.exec(`RELEASE ${SAVEPOINT};`);
    return result;
  } catch (error) {
    // Cancel the changes made since the savepoint, then remove it
    database.exec(`ROLLBACK TO ${SAVEPOINT};`);
    database.exec(`RELEASE ${SAVEPOINT};`);
    throw error;
  }
}
