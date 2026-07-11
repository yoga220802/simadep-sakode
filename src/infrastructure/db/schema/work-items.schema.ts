import "@/src/infrastructure/server-only";

import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import {
  char,
  date,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { projects } from "./projects.schema";
import {
  createdAtColumn,
  idColumn,
  legacyIdColumn,
  nullableUserIdColumn,
  updatedAtColumn,
  userIdColumn,
  versionColumn,
} from "./_columns";

export const milestones = mysqlTable(
  "milestones",
  {
    id: idColumn(),
    legacyId: legacyIdColumn(),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    displayOrder: int("display_order", { unsigned: true }).notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    legacyUnique: uniqueIndex("milestones_legacy_id_unique").on(table.legacyId),
    projectOrderUnique: uniqueIndex("milestones_project_order_unique").on(
      table.projectId,
      table.displayOrder,
    ),
  }),
);

export const taskCategories = mysqlTable(
  "task_categories",
  {
    id: idColumn(),
    legacyId: legacyIdColumn(),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    legacyUnique: uniqueIndex("task_categories_legacy_id_unique").on(
      table.legacyId,
    ),
    projectNameUnique: uniqueIndex("task_categories_project_name_unique").on(
      table.projectId,
      table.name,
    ),
  }),
);

export const projectTaskStatuses = mysqlTable(
  "project_task_statuses",
  {
    id: idColumn(),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 80 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    displayOrder: int("display_order", { unsigned: true }).notNull().default(0),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    projectValueUnique: uniqueIndex(
      "project_task_statuses_project_value_unique",
    ).on(table.projectId, table.value),
    projectOrderIdx: index("project_task_statuses_project_order_idx").on(
      table.projectId,
      table.displayOrder,
    ),
  }),
);

export const tasks = mysqlTable(
  "tasks",
  {
    id: idColumn(),
    legacyId: legacyIdColumn(),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    milestoneId: varchar("milestone_id", { length: 36 })
      .notNull()
      .references(() => milestones.id, { onDelete: "cascade" }),
    parentId: varchar("parent_id", { length: 36 }).references(
      (): AnyMySqlColumn => tasks.id,
      { onDelete: "cascade" },
    ),
    categoryId: varchar("category_id", { length: 36 }).references(
      () => taskCategories.id,
      { onDelete: "set null" },
    ),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 80 }).notNull().default("pending"),
    priority: mysqlEnum("priority", ["low", "medium", "high"]),
    displayOrder: int("display_order", { unsigned: true }).notNull().default(0),
    startDate: date("start_date", { mode: "date" }),
    dueDate: date("due_date", { mode: "date" }),
    estimatedDurationMinutes: int("estimated_duration_minutes", {
      unsigned: true,
    }),
    finishedDurationMinutes: int("finished_duration_minutes", {
      unsigned: true,
    }),
    completedAt: datetime("completed_at", { mode: "date", fsp: 3 }),
    createdBy: nullableUserIdColumn("created_by"),
    version: versionColumn(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    legacyUnique: uniqueIndex("tasks_legacy_id_unique").on(table.legacyId),
    projectStatusIdx: index("tasks_project_status_idx").on(
      table.projectId,
      table.status,
    ),
    milestoneOrderIdx: index("tasks_milestone_order_idx").on(
      table.milestoneId,
      table.displayOrder,
    ),
    parentIdx: index("tasks_parent_idx").on(table.parentId),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
    categoryIdx: index("tasks_category_idx").on(table.categoryId),
  }),
);

export const taskAssignees = mysqlTable(
  "task_assignees",
  {
    id: idColumn(),
    taskId: varchar("task_id", { length: 36 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: userIdColumn("user_id"),
    assignedBy: nullableUserIdColumn("assigned_by"),
    assignedAt: datetime("assigned_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    taskUserUnique: uniqueIndex("task_assignees_task_user_unique").on(
      table.taskId,
      table.userId,
    ),
    userTaskIdx: index("task_assignees_user_task_idx").on(
      table.userId,
      table.taskId,
    ),
  }),
);

export const attachmentChecksumColumn = () =>
  char("checksum_sha256", { length: 64 });
