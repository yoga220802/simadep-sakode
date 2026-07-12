import "@/src/infrastructure/server-only";

import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

import {
  createdAtColumn,
  idColumn,
  nullableUserIdColumn,
  updatedAtColumn,
  userIdColumn,
} from "./_columns";

export const departments = mysqlTable(
  "departments",
  {
    id: idColumn(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["active", "archived"])
      .notNull()
      .default("active"),
    createdBy: nullableUserIdColumn("created_by"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    archivedAt: datetime("archived_at", { mode: "date", fsp: 3 }),
  },
  (table) => ({
    codeUnique: uniqueIndex("departments_code_unique").on(table.code),
    statusIdx: index("departments_status_idx").on(table.status),
  }),
);

export const departmentMembers = mysqlTable(
  "department_members",
  {
    id: idColumn(),
    departmentId: varchar("department_id", { length: 36 })
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    userId: userIdColumn("user_id"),
    role: mysqlEnum("role", [
      "head",
      "department_admin",
      "member",
      "viewer",
    ])
      .notNull()
      .default("member"),
    status: mysqlEnum("status", ["active", "inactive"])
      .notNull()
      .default("active"),
    joinedAt: datetime("joined_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    endedAt: datetime("ended_at", { mode: "date", fsp: 3 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    departmentUserUnique: uniqueIndex(
      "department_members_department_user_unique",
    ).on(table.departmentId, table.userId),
    userIdx: index("department_members_user_idx").on(table.userId),
    departmentStatusIdx: index("department_members_department_status_idx").on(
      table.departmentId,
      table.status,
    ),
  }),
);
