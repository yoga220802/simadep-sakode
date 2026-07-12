import "@/src/infrastructure/server-only";

import { index, json, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { departments } from "./departments.schema";
import { projects } from "./projects.schema";
import { tasks } from "./work-items.schema";
import {
  createdAtColumn,
  idColumn,
  nullableUserIdColumn,
} from "./_columns";

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: idColumn(),
    correlationId: varchar("correlation_id", { length: 80 }),
    performedBy: nullableUserIdColumn("performed_by"),
    departmentId: varchar("department_id", { length: 36 }).references(
      () => departments.id,
      { onDelete: "set null" },
    ),
    projectId: varchar("project_id", { length: 36 }).references(
      () => projects.id,
      { onDelete: "set null" },
    ),
    taskId: varchar("task_id", { length: 36 }).references(() => tasks.id, {
      onDelete: "set null",
    }),
    resourceType: varchar("resource_type", { length: 80 }).notNull(),
    resourceId: varchar("resource_id", { length: 80 }),
    actionType: varchar("action_type", { length: 80 }).notNull(),
    previousData: json("previous_data"),
    newData: json("new_data"),
    metadata: json("metadata"),
    createdAt: createdAtColumn(),
  },
  (table) => ({
    performedByIdx: index("audit_logs_performed_by_idx").on(table.performedBy),
    resourceIdx: index("audit_logs_resource_idx").on(
      table.resourceType,
      table.resourceId,
    ),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    correlationIdx: index("audit_logs_correlation_idx").on(table.correlationId),
  }),
);
