import { describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("department DB integration", () => {
  it("can query departments table", async () => {
    const rows = await getDb().select().from(schema.departments).limit(1);

    expect(Array.isArray(rows)).toBe(true);

    await closeDb();
  });
});
