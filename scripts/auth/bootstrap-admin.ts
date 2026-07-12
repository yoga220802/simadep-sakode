import { eq, inArray, and, count } from "drizzle-orm";

import { auth } from "@/src/infrastructure/auth";
import { closeDb, getDb, schema } from "@/src/infrastructure/db";
import { upsertUserProfile } from "@/src/features/identity/users/use-cases";

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for local bootstrap admin.`);
  }

  return value;
}

async function hasActivePrivilegedAdmin() {
  const [row] = await getDb()
    .select({ value: count() })
    .from(schema.user)
    .where(
      and(
        inArray(schema.user.role, ["super_admin", "admin"]),
        eq(schema.user.banned, false),
      ),
    );

  return (row?.value ?? 0) > 0;
}

async function main() {
  const email = readRequiredEnv("SIMADEP_BOOTSTRAP_ADMIN_EMAIL");
  const password = readRequiredEnv("SIMADEP_BOOTSTRAP_ADMIN_PASSWORD");
  const name = process.env.SIMADEP_BOOTSTRAP_ADMIN_NAME?.trim() || "SIMADEP Admin";

  if (await hasActivePrivilegedAdmin()) {
    console.log("Bootstrap skipped: an active privileged admin already exists.");
    return;
  }

  const [existingUser] = await getDb()
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  const userId =
    existingUser?.id ??
    (
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      })
    ).user.id;

  await getDb()
    .update(schema.user)
    .set({
      role: "super_admin",
      banned: false,
      banReason: null,
      banExpires: null,
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, userId));

  await upsertUserProfile({
    userId,
    displayName: name,
    employeeNumber: process.env.SIMADEP_BOOTSTRAP_ADMIN_EMPLOYEE_NUMBER,
    position: "Bootstrap Administrator",
    workUnit: "SIMADEP",
  });

  await getDb().insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    performedBy: userId,
    resourceType: "user",
    resourceId: userId,
    actionType: "user.bootstrap_admin_created",
    newData: { email, role: "super_admin" },
  });

  console.log(`Bootstrap admin is ready for ${email}.`);
}

main()
  .then(async () => {
    await closeDb();
  })
  .catch(async (error: unknown) => {
    await closeDb();
    console.error(error);
    process.exitCode = 1;
  });
