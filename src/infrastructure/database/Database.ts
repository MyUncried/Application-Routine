export type SqlValue = string | number | null | Uint8Array;
export type SqlParameters = readonly SqlValue[];

export type SqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface Database {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, parameters?: SqlParameters): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, parameters?: SqlParameters): Promise<T | null>;
  getAllAsync<T>(source: string, parameters?: SqlParameters): Promise<T[]>;
  withExclusiveTransactionAsync(task: (transaction: Database) => Promise<void>): Promise<void>;
}
