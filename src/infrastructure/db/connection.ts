import "@/src/infrastructure/server-only";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { requireDatabaseUrl } from "@/src/infrastructure/env";

import * as schema from "./schema";

let pool: mysql.Pool | undefined;
let database: ReturnType<typeof createDatabase> | undefined;

function createPool() {
  return mysql.createPool({
    uri: requireDatabaseUrl(),
    connectionLimit: 10,
    timezone: "Z",
  });
}

function createDatabase(dbPool: mysql.Pool) {
  return drizzle(dbPool, {
    mode: "default",
    schema,
  });
}

export type Database = ReturnType<typeof createDatabase>;

export function getDbPool(): mysql.Pool {
  pool ??= createPool();
  return pool;
}

export function getDb(): Database {
  database ??= createDatabase(getDbPool());
  return database;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
