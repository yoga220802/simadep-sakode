import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";
import { seedIds } from "@/src/infrastructure/db/seed-data";

import { createManagedUser } from "./use-cases";

const runDbTests = process.env.RUN_DB_TESTS === "1";
const testEmail = "managed.integration.local@simadep.test";

async function cleanupManagedUser() {
  const [user] = await getDb()
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, testEmail))
    .limit(1);

  if (!user) {
    return;
  }

  await getDb()
    .delete(schema.auditLogs)
    .where(eq(schema.auditLogs.resourceId, user.id));
  await getDb()
    .delete(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id));
  await getDb().delete(schema.account).where(eq(schema.account.userId, user.id));
  await getDb().delete(schema.user).where(eq(schema.user.id, user.id));
}

describe.skipIf(!runDbTests)("identity user management DB integration", () => {
  beforeEach(async () => {
    await cleanupManagedUser();
  });

  afterAll(async () => {
    await cleanupManagedUser();
    await closeDb();
  });

  it("can inspect Better Auth and SIMADEP profile tables", async () => {
    const [row] = await getDb().select().from(schema.user).limit(1);

    expect(row ?? null).toBeDefined();
  });

  it("allows a super admin to create a managed user with credentials", async () => {
    const created = await createManagedUser(
      { id: seedIds.users.bootstrapAdmin, role: "super_admin" },
      {
        email: testEmail,
        name: "Managed Integration User",
        password: "ManagedLocal2026!",
        role: "user",
        employeeNumber: "SIMADEP-IT-MANAGED",
        position: "Integration Tester",
        workUnit: "SIMADEP",
      },
    );

    const [account] = await getDb()
      .select({
        providerId: schema.account.providerId,
        hasPassword: schema.account.password,
      })
      .from(schema.account)
      .where(eq(schema.account.userId, created.id))
      .limit(1);

    expect(account?.providerId).toBe("credential");
    expect(account?.hasPassword).toBeTruthy();
  });
});
