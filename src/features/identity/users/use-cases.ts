import "@/src/infrastructure/server-only";

import { and, count, eq, inArray } from "drizzle-orm";

import { getDb, inTransaction, schema } from "@/src/infrastructure/db";
import { auth } from "@/src/infrastructure/auth";

import {
  assertCanBanUser,
  assertCanChangeGlobalRole,
  assertCanManageUsers,
  isGlobalRole,
  type GlobalRole,
} from "./policy";
import {
  banUserInputSchema,
  createManagedUserInputSchema,
  revokeUserSessionInputSchema,
  setGlobalRoleInputSchema,
  updateUserProfileInputSchema,
  type BanUserInput,
  type CreateManagedUserInput,
  type RevokeUserSessionInput,
  type SetGlobalRoleInput,
  type UpdateUserProfileInput,
} from "./types";

type Actor = {
  id: string;
  role: string | null | undefined;
};

async function getUserOrThrow(userId: string) {
  const [user] = await getDb()
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}

async function countActivePrivilegedUsers() {
  const [row] = await getDb()
    .select({ value: count() })
    .from(schema.user)
    .where(
      and(
        inArray(schema.user.role, ["super_admin", "admin"]),
        eq(schema.user.banned, false),
      ),
    );

  return row?.value ?? 0;
}

async function writeAudit(input: {
  actorId: string;
  targetUserId: string;
  actionType: string;
  previousData?: unknown;
  newData?: unknown;
}) {
  await getDb().insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    performedBy: input.actorId,
    resourceType: "user",
    resourceId: input.targetUserId,
    actionType: input.actionType,
    previousData: input.previousData,
    newData: input.newData,
  });
}

export async function upsertUserProfile(input: UpdateUserProfileInput) {
  const parsed = updateUserProfileInputSchema.parse(input);

  await getDb()
    .insert(schema.userProfiles)
    .values({
      userId: parsed.userId,
      employeeNumber: parsed.employeeNumber,
      displayName: parsed.displayName,
      position: parsed.position,
      workUnit: parsed.workUnit,
      phone: parsed.phone,
      avatarUrl: parsed.avatarUrl,
    })
    .onDuplicateKeyUpdate({
      set: {
        employeeNumber: parsed.employeeNumber,
        displayName: parsed.displayName,
        position: parsed.position,
        workUnit: parsed.workUnit,
        phone: parsed.phone,
        avatarUrl: parsed.avatarUrl,
        updatedAt: new Date(),
      },
    });
}

export async function listManagedUsers(actor: Actor) {
  assertCanManageUsers(actor.role);

  return getDb()
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
      role: schema.user.role,
      banned: schema.user.banned,
      banReason: schema.user.banReason,
      banExpires: schema.user.banExpires,
      employeeNumber: schema.userProfiles.employeeNumber,
      displayName: schema.userProfiles.displayName,
      position: schema.userProfiles.position,
      workUnit: schema.userProfiles.workUnit,
    })
    .from(schema.user)
    .leftJoin(
      schema.userProfiles,
      eq(schema.userProfiles.userId, schema.user.id),
    );
}

export async function createManagedUser(
  actor: Actor,
  input: CreateManagedUserInput,
) {
  assertCanManageUsers(actor.role);
  const parsed = createManagedUserInputSchema.parse(input);

  const result = await auth.api.createUser({
    body: {
      email: parsed.email,
      password: parsed.password,
      name: parsed.name,
      role: parsed.role === "super_admin" ? "admin" : parsed.role,
    },
  });

  await getDb()
    .update(schema.user)
    .set({ role: parsed.role, updatedAt: new Date() })
    .where(eq(schema.user.id, result.user.id));

  await upsertUserProfile({
    userId: result.user.id,
    employeeNumber: parsed.employeeNumber,
    displayName: parsed.displayName ?? parsed.name,
    position: parsed.position,
    workUnit: parsed.workUnit,
    phone: parsed.phone,
  });

  await writeAudit({
    actorId: actor.id,
    targetUserId: result.user.id,
    actionType: "user.created",
    newData: { email: parsed.email, role: parsed.role },
  });

  return result.user;
}

export async function setGlobalRole(actor: Actor, input: SetGlobalRoleInput) {
  const parsed = setGlobalRoleInputSchema.parse(input);
  const target = await getUserOrThrow(parsed.targetUserId);

  if (!isGlobalRole(parsed.role)) {
    throw new Error("Invalid global role.");
  }

  assertCanChangeGlobalRole({
    actorId: actor.id,
    actorRole: actor.role,
    targetUserId: parsed.targetUserId,
    currentTargetRole: target.role,
    nextRole: parsed.role as GlobalRole,
    activePrivilegedUserCount: await countActivePrivilegedUsers(),
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.user)
      .set({ role: parsed.role, updatedAt: new Date() })
      .where(eq(schema.user.id, parsed.targetUserId));

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: parsed.targetUserId,
      actionType: "user.role_changed",
      previousData: { role: target.role },
      newData: { role: parsed.role },
    });
  });
}

export async function banManagedUser(actor: Actor, input: BanUserInput) {
  const parsed = banUserInputSchema.parse(input);
  const target = await getUserOrThrow(parsed.targetUserId);

  assertCanBanUser({
    actorId: actor.id,
    actorRole: actor.role,
    targetUserId: parsed.targetUserId,
    targetRole: target.role,
    activePrivilegedUserCount: await countActivePrivilegedUsers(),
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.user)
      .set({
        banned: true,
        banReason:
          parsed.reason ?? "Akun dinonaktifkan oleh administrator SIMADEP.",
        banExpires: parsed.expiresAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, parsed.targetUserId));

    await tx
      .delete(schema.session)
      .where(eq(schema.session.userId, parsed.targetUserId));

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: parsed.targetUserId,
      actionType: "user.banned",
      previousData: { banned: target.banned },
      newData: { reason: parsed.reason, expiresAt: parsed.expiresAt },
    });
  });
}

export async function unbanManagedUser(actor: Actor, input: BanUserInput) {
  assertCanManageUsers(actor.role);
  const parsed = banUserInputSchema.parse(input);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, parsed.targetUserId));

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: parsed.targetUserId,
      actionType: "user.unbanned",
      newData: { banned: false },
    });
  });
}

export async function revokeManagedUserSessions(
  actor: Actor,
  input: RevokeUserSessionInput,
) {
  assertCanManageUsers(actor.role);
  const parsed = revokeUserSessionInputSchema.parse(input);

  await inTransaction(async (tx) => {
    if (parsed.sessionToken) {
      await tx
        .delete(schema.session)
        .where(eq(schema.session.token, parsed.sessionToken));
    } else {
      await tx
        .delete(schema.session)
        .where(eq(schema.session.userId, parsed.targetUserId));
    }

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: parsed.targetUserId,
      actionType: parsed.sessionToken
        ? "user.session_revoked"
        : "user.sessions_revoked",
      newData: { sessionToken: parsed.sessionToken ? "[redacted]" : undefined },
    });
  });
}
