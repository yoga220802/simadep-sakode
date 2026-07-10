import { describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("collaboration DB integration", () => {
  it("can query comments and attachments tables", async () => {
    const [comments, attachments] = await Promise.all([
      getDb().select().from(schema.comments).limit(1),
      getDb().select().from(schema.attachments).limit(1),
    ]);

    expect(Array.isArray(comments)).toBe(true);
    expect(Array.isArray(attachments)).toBe(true);

    await closeDb();
  });
});
