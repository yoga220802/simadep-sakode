import { verifyPassword } from "better-auth/crypto";
import { inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";
import { seedLoginPassword, seedUsers } from "@/src/infrastructure/db/seed-data";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("release seed credentials", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("creates Better Auth credential accounts for every local seed user", async () => {
    const seedUserIds = seedUsers.map((user) => user.id);
    const rows = await getDb()
      .select({
        userId: schema.account.userId,
        providerId: schema.account.providerId,
        password: schema.account.password,
      })
      .from(schema.account)
      .where(inArray(schema.account.userId, seedUserIds));

    expect(rows).toHaveLength(seedUsers.length);
    expect(rows.every((row) => row.providerId === "credential")).toBe(true);
    expect(rows.every((row) => row.password)).toBe(true);
    await expect(
      verifyPassword({
        hash: rows[0].password ?? "",
        password: seedLoginPassword,
      }),
    ).resolves.toBe(true);
  });
});
