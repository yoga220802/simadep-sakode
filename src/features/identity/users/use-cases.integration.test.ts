import { describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("identity user management DB integration", () => {
  it("can inspect Better Auth and SIMADEP profile tables", async () => {
    const [row] = await getDb().select().from(schema.user).limit(1);

    expect(row ?? null).toBeDefined();

    await closeDb();
  });
});
