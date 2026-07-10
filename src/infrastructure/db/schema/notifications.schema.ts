import "@/src/infrastructure/server-only";

import {
  boolean,
  datetime,
  index,
  json,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { projects } from "./projects.schema";
import { tasks } from "./work-items.schema";
import {
  createdAtColumn,
  idColumn,
  nullableUserIdColumn,
  updatedAtColumn,
  userIdColumn,
} from "./_columns";

export const notifications = mysqlTable(
  "notifications",
  {
    id: idColumn(),
    recipientId: userIdColumn("recipient_id"),
    actorId: nullableUserIdColumn("actor_id"),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    projectId: varchar("project_id", { length: 36 }).references(
      () => projects.id,
      { onDelete: "set null" },
    ),
    taskId: varchar("task_id", { length: 36 }).references(() => tasks.id, {
      onDelete: "set null",
    }),
    data: json("data"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: datetime("read_at", { mode: "date", fsp: 3 }),
    createdAt: createdAtColumn(),
  },
  (table) => ({
    recipientReadCreatedIdx: index(
      "notifications_recipient_read_created_idx",
    ).on(table.recipientId, table.isRead, table.createdAt),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

export const deviceTokens = mysqlTable(
  "device_tokens",
  {
    id: idColumn(),
    userId: userIdColumn("user_id"),
    provider: mysqlEnum("provider", ["fcm"]).notNull().default("fcm"),
    token: varchar("token", { length: 512 }).notNull(),
    deviceName: varchar("device_name", { length: 120 }),
    lastSeenAt: datetime("last_seen_at", { mode: "date", fsp: 3 }),
    revokedAt: datetime("revoked_at", { mode: "date", fsp: 3 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("device_tokens_token_unique").on(table.token),
    userIdx: index("device_tokens_user_idx").on(table.userId),
  }),
);
