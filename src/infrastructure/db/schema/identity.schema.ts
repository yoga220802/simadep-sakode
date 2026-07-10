import "@/src/infrastructure/server-only";

import {
  datetime,
  bigint,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { user } from "./auth.schema";
import { createdAtColumn, updatedAtColumn } from "./_columns";

export const userProfiles = mysqlTable(
  "user_profiles",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeNumber: varchar("employee_number", { length: 50 }),
    legacyEmployeeId: bigint("legacy_employee_id", {
      mode: "number",
      unsigned: true,
    }),
    displayName: varchar("display_name", { length: 150 }).notNull(),
    position: varchar("position", { length: 120 }),
    workUnit: varchar("work_unit", { length: 150 }),
    phone: varchar("phone", { length: 50 }),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    employmentStatus: mysqlEnum("employment_status", [
      "active",
      "inactive",
      "suspended",
    ])
      .notNull()
      .default("active"),
    joinedAt: datetime("joined_at", { mode: "date", fsp: 3 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    employeeNumberUnique: uniqueIndex(
      "user_profiles_employee_number_unique",
    ).on(table.employeeNumber),
    legacyEmployeeUnique: uniqueIndex(
      "user_profiles_legacy_employee_id_unique",
    ).on(table.legacyEmployeeId),
  }),
);
