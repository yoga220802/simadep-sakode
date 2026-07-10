import "@/src/infrastructure/server-only";

import {
  date,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { departments } from "./departments.schema";
import {
  createdAtColumn,
  idColumn,
  legacyIdColumn,
  nullableUserIdColumn,
  updatedAtColumn,
  userIdColumn,
  versionColumn,
} from "./_columns";

export const projects = mysqlTable(
  "projects",
  {
    id: idColumn(),
    legacyId: legacyIdColumn(),
    departmentId: varchar("department_id", { length: 36 })
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["tender", "active", "completed", "cancelled"])
      .notNull()
      .default("tender"),
    startDate: date("start_date", { mode: "date" }),
    endDate: date("end_date", { mode: "date" }),
    createdBy: nullableUserIdColumn("created_by"),
    version: versionColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
  },
  (table) => ({
    legacyUnique: uniqueIndex("projects_legacy_id_unique").on(table.legacyId),
    departmentStatusIdx: index("projects_department_status_idx").on(
      table.departmentId,
      table.status,
    ),
    departmentStartIdx: index("projects_department_start_idx").on(
      table.departmentId,
      table.startDate,
    ),
    createdByIdx: index("projects_created_by_idx").on(table.createdBy),
    deletedIdx: index("projects_deleted_idx").on(table.deletedAt),
  }),
);

export const projectMembers = mysqlTable(
  "project_members",
  {
    id: idColumn(),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: userIdColumn("user_id"),
    role: mysqlEnum("role", ["owner", "manager", "contributor", "viewer"])
      .notNull()
      .default("contributor"),
    createdBy: nullableUserIdColumn("created_by"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    projectUserUnique: uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId,
    ),
    userProjectIdx: index("project_members_user_project_idx").on(
      table.userId,
      table.projectId,
    ),
  }),
);
