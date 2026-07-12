import "@/src/infrastructure/server-only";

import {
  bigint,
  char,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { tasks } from "./work-items.schema";
import {
  createdAtColumn,
  idColumn,
  legacyIdColumn,
  nullableUserIdColumn,
  userIdColumn,
} from "./_columns";

export const comments = mysqlTable(
  "comments",
  {
    id: idColumn(),
    legacyId: legacyIdColumn(),
    taskId: varchar("task_id", { length: 36 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: userIdColumn("user_id"),
    content: text("content").notNull(),
    createdAt: createdAtColumn(),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
  },
  (table) => ({
    legacyUnique: uniqueIndex("comments_legacy_id_unique").on(table.legacyId),
    taskCreatedIdx: index("comments_task_created_idx").on(
      table.taskId,
      table.createdAt,
    ),
    userIdx: index("comments_user_idx").on(table.userId),
  }),
);

export const attachments = mysqlTable(
  "attachments",
  {
    id: idColumn(),
    legacyId: legacyIdColumn(),
    taskId: varchar("task_id", { length: 36 })
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    commentId: varchar("comment_id", { length: 36 }).references(
      () => comments.id,
      { onDelete: "set null" },
    ),
    uploadedBy: nullableUserIdColumn("uploaded_by"),
    kind: mysqlEnum("kind", ["file", "link"]).notNull().default("file"),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    storageKey: varchar("storage_key", { length: 500 }),
    externalUrl: varchar("external_url", { length: 1000 }),
    mimeType: varchar("mime_type", { length: 120 }),
    sizeBytes: bigint("size_bytes", { mode: "number", unsigned: true }),
    checksumSha256: char("checksum_sha256", { length: 64 }),
    createdAt: createdAtColumn(),
  },
  (table) => ({
    legacyUnique: uniqueIndex("attachments_legacy_id_unique").on(
      table.legacyId,
    ),
    taskIdx: index("attachments_task_idx").on(table.taskId),
    commentIdx: index("attachments_comment_idx").on(table.commentId),
    uploadedByIdx: index("attachments_uploaded_by_idx").on(table.uploadedBy),
  }),
);
