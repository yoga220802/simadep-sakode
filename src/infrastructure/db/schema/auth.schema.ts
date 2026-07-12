import "@/src/infrastructure/server-only";

import {
  boolean,
  datetime,
  index,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { createdAtColumn, idColumn, updatedAtColumn } from "./_columns";

export const user = mysqlTable(
  "user",
  {
    id: idColumn(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: varchar("image", { length: 500 }),
    role: varchar("role", { length: 80 }).notNull().default("user"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: datetime("ban_expires", { mode: "date", fsp: 3 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    emailUnique: uniqueIndex("user_email_unique").on(table.email),
    roleIdx: index("user_role_idx").on(table.role),
    bannedIdx: index("user_banned_idx").on(table.banned),
  }),
);

export const session = mysqlTable(
  "session",
  {
    id: idColumn(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    ipAddress: varchar("ip_address", { length: 100 }),
    userAgent: text("user_agent"),
    impersonatedBy: varchar("impersonated_by", { length: 36 }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("session_token_unique").on(table.token),
    userIdx: index("session_user_idx").on(table.userId),
  }),
);

export const account = mysqlTable(
  "account",
  {
    id: idColumn(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: datetime("access_token_expires_at", {
      mode: "date",
      fsp: 3,
    }),
    refreshTokenExpiresAt: datetime("refresh_token_expires_at", {
      mode: "date",
      fsp: 3,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    userIdx: index("account_user_idx").on(table.userId),
    providerAccountIdx: index("account_provider_account_idx").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

export const verification = mysqlTable(
  "verification",
  {
    id: idColumn(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  }),
);
