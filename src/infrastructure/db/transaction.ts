import "@/src/infrastructure/server-only";

import { getDb, type Database } from "./connection";

export type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export async function inTransaction<T>(
  work: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  return getDb().transaction((tx) => work(tx));
}
