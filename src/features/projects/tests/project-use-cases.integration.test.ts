import { describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("project DB integration", () => {
  it("can query projects and project members tables", async () => {
    const [projectRows, memberRows] = await Promise.all([
      getDb().select().from(schema.projects).limit(1),
      getDb().select().from(schema.projectMembers).limit(1),
    ]);

    expect(Array.isArray(projectRows)).toBe(true);
    expect(Array.isArray(memberRows)).toBe(true);

    await closeDb();
  });
});
