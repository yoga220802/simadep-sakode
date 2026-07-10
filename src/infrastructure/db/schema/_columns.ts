import {
  bigint,
  datetime,
  int,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const idColumn = (name = "id") =>
  varchar(name, { length: 36 }).notNull().primaryKey();

export const nullableIdColumn = (name: string) => varchar(name, { length: 36 });

export const userIdColumn = (name = "user_id") =>
  varchar(name, { length: 36 }).notNull();

export const nullableUserIdColumn = (name: string) =>
  varchar(name, { length: 36 });

export const legacyIdColumn = (name = "legacy_id") =>
  bigint(name, { mode: "number", unsigned: true });

export const versionColumn = () =>
  int("version", { unsigned: true }).notNull().default(1);

export const createdAtColumn = (name = "created_at") =>
  datetime(name, { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);

export const updatedAtColumn = (name = "updated_at") =>
  datetime(name, { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);

export const nullableDateTimeColumn = (name: string) =>
  datetime(name, { mode: "date", fsp: 3 });
