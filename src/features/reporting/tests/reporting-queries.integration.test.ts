import { describe, expect, it } from "vitest";

import { listAuditActivity } from "@/src/features/audit";
import { getProjectActor } from "@/src/features/projects";
import { getDashboardForActor } from "@/src/features/reporting";
import { closeDb, getDb, schema } from "@/src/infrastructure/db";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("reporting DB integration", () => {
  it("can query dashboard and audit activity for a seeded actor", async () => {
    const [user] = await getDb().select({ id: schema.user.id }).from(schema.user).limit(1);

    expect(user?.id).toBeTruthy();

    if (user) {
      const actor = await getProjectActor(user.id);
      const [dashboard, auditItems] = await Promise.all([
        getDashboardForActor(actor),
        listAuditActivity(actor, { limit: 5 }),
      ]);

      expect(dashboard.projectStatusCounts.total).toBeGreaterThanOrEqual(0);
      expect(dashboard.taskStatusCounts.total).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(auditItems)).toBe(true);
    }

    await closeDb();
  });
});
