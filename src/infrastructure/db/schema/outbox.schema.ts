import "@/src/infrastructure/server-only";

import {
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

import {
  createdAtColumn,
  idColumn,
  updatedAtColumn,
} from "./_columns";

export const outboxEvents = mysqlTable(
  "outbox_events",
  {
    id: idColumn(),
    eventType: varchar("event_type", { length: 120 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 80 }).notNull(),
    aggregateId: varchar("aggregate_id", { length: 80 }).notNull(),
    payload: json("payload").notNull(),
    status: mysqlEnum("status", ["pending", "processing", "processed", "failed"])
      .notNull()
      .default("pending"),
    attemptCount: int("attempt_count", { unsigned: true }).notNull().default(0),
    availableAt: datetime("available_at", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    processedAt: datetime("processed_at", { mode: "date", fsp: 3 }),
    lastError: text("last_error"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    statusAvailableCreatedIdx: index(
      "outbox_events_status_available_created_idx",
    ).on(table.status, table.availableAt, table.createdAt),
    aggregateIdx: index("outbox_events_aggregate_idx").on(
      table.aggregateType,
      table.aggregateId,
    ),
  }),
);
