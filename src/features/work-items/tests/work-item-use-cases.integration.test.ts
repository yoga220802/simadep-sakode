import { describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("work item DB integration", () => {
  it("can query work item tables", async () => {
    const [milestones, categories, tasks, assignees] = await Promise.all([
      getDb().select().from(schema.milestones).limit(1),
      getDb().select().from(schema.taskCategories).limit(1),
      getDb().select().from(schema.tasks).limit(1),
      getDb().select().from(schema.taskAssignees).limit(1),
    ]);

    expect(Array.isArray(milestones)).toBe(true);
    expect(Array.isArray(categories)).toBe(true);
    expect(Array.isArray(tasks)).toBe(true);
    expect(Array.isArray(assignees)).toBe(true);

    await closeDb();
  });
});
