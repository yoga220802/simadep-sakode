import "@/src/infrastructure/server-only";

import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, count, eq, inArray } from "drizzle-orm";

import {
  getDb,
  inTransaction,
  schema,
  type DatabaseTransaction,
} from "@/src/infrastructure/db";

import {
  assertCanBanUser,
  assertCanChangeGlobalRole,
  assertCanManageUsers,
  isGlobalRole,
  type GlobalRole,
} from "./policy";
import {
  banUserInputSchema,
  bulkCreateManagedUsersInputSchema,
  createManagedUserInputSchema,
  resetManagedUserPasswordInputSchema,
  revokeUserSessionInputSchema,
  setGlobalRoleInputSchema,
  updateOwnPasswordInputSchema,
  updateUserProfileInputSchema,
  type BulkCreateManagedUsersInput,
  type BanUserInput,
  type CreateManagedUserInput,
  type ResetManagedUserPasswordInput,
  type RevokeUserSessionInput,
  type SetGlobalRoleInput,
  type UpdateOwnPasswordInput,
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

async function getCredentialAccountOrThrow(userId: string) {
  const [account] = await getDb()
    .select()
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential"),
      ),
    )
    .limit(1);

  if (!account || !account.password) {
    throw new Error("Credential account not found.");
  }

  return account;
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
      phone: schema.userProfiles.phone,
      avatarUrl: schema.userProfiles.avatarUrl,
    })
    .from(schema.user)
    .leftJoin(
      schema.userProfiles,
      eq(schema.userProfiles.userId, schema.user.id),
    );
}

export async function getUserProfile(actor: Actor, userId = actor.id) {
  const isSelf = actor.id === userId;
  if (!isSelf) {
    assertCanManageUsers(actor.role);
  }

  const [row] = await getDb()
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
      image: schema.user.image,
      role: schema.user.role,
      banned: schema.user.banned,
      employeeNumber: schema.userProfiles.employeeNumber,
      displayName: schema.userProfiles.displayName,
      position: schema.userProfiles.position,
      workUnit: schema.userProfiles.workUnit,
      phone: schema.userProfiles.phone,
      avatarUrl: schema.userProfiles.avatarUrl,
    })
    .from(schema.user)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!row) {
    throw new Error("User not found.");
  }

  return row;
}

async function insertManagedUser(
  tx: DatabaseTransaction,
  actor: Actor,
  parsed: CreateManagedUserInput,
) {
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(parsed.password);

  await tx.insert(schema.user).values({
    id: userId,
    email: parsed.email,
    name: parsed.name,
    emailVerified: true,
    role: parsed.role,
  });

  await tx.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  await tx.insert(schema.userProfiles).values({
    userId,
    employeeNumber: parsed.employeeNumber,
    displayName: parsed.displayName ?? parsed.name,
    position: parsed.position,
    workUnit: parsed.workUnit,
    phone: parsed.phone,
  });

  await tx.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    performedBy: actor.id,
    resourceType: "user",
    resourceId: userId,
    actionType: "user.created",
    newData: { email: parsed.email, role: parsed.role },
  });

  return userId;
}

export async function createManagedUser(
  actor: Actor,
  input: CreateManagedUserInput,
) {
  assertCanManageUsers(actor.role);
  const parsed = createManagedUserInputSchema.parse(input);
  let userId = "";

  await inTransaction(async (tx) => {
    userId = await insertManagedUser(tx, actor, parsed);
  });

  return {
    id: userId,
    email: parsed.email,
    name: parsed.name,
    role: parsed.role,
  };
}

export async function bulkCreateManagedUsers(
  actor: Actor,
  input: BulkCreateManagedUsersInput,
) {
  assertCanManageUsers(actor.role);
  const parsed = bulkCreateManagedUsersInputSchema.parse(input);
  const created: Array<{ id: string; email: string }> = [];

  await inTransaction(async (tx) => {
    for (const userInput of parsed.users) {
      const id = await insertManagedUser(tx, actor, userInput);
      created.push({ id, email: userInput.email });
    }
  });

  return created;
}

export async function updateUserProfile(actor: Actor, input: UpdateUserProfileInput) {
  const parsed = updateUserProfileInputSchema.parse(input);
  const isSelf = actor.id === parsed.userId;

  if (!isSelf) {
    assertCanManageUsers(actor.role);
  }

  if (parsed.email) {
    assertCanManageUsers(actor.role);
  }

  await inTransaction(async (tx) => {
    const userUpdate: Partial<typeof schema.user.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.name) {
      userUpdate.name = parsed.name;
    }

    if (parsed.email) {
      userUpdate.email = parsed.email;
    }

    if (parsed.avatarUrl !== undefined) {
      userUpdate.image = parsed.avatarUrl ?? null;
    }

    await tx
      .update(schema.user)
      .set(userUpdate)
      .where(eq(schema.user.id, parsed.userId));

    await tx
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

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: parsed.userId,
      actionType: isSelf ? "user.profile_updated" : "user.profile_admin_updated",
      newData: { emailChanged: Boolean(parsed.email) },
    });
  });
}

export async function updateOwnPassword(
  actor: Actor,
  input: UpdateOwnPasswordInput,
) {
  const parsed = updateOwnPasswordInputSchema.parse(input);

  if (actor.id !== parsed.userId) {
    throw new Error("Cannot change another user's password through profile.");
  }

  const account = await getCredentialAccountOrThrow(actor.id);
  const isValid = await verifyPassword({
    hash: account.password ?? "",
    password: parsed.currentPassword,
  });

  if (!isValid) {
    throw new Error("Password saat ini tidak sesuai.");
  }

  const nextHash = await hashPassword(parsed.newPassword);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.account)
      .set({ password: nextHash, updatedAt: new Date() })
      .where(eq(schema.account.id, account.id));

    await tx
      .delete(schema.session)
      .where(eq(schema.session.userId, actor.id));

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: actor.id,
      actionType: "user.password_changed",
    });
  });
}

export async function resetManagedUserPassword(
  actor: Actor,
  input: ResetManagedUserPasswordInput,
) {
  assertCanManageUsers(actor.role);
  const parsed = resetManagedUserPasswordInputSchema.parse(input);
  const target = await getUserOrThrow(parsed.targetUserId);
  const passwordHash = await hashPassword(parsed.password);

  await inTransaction(async (tx) => {
    const [account] = await tx
      .select()
      .from(schema.account)
      .where(
        and(
          eq(schema.account.userId, parsed.targetUserId),
          eq(schema.account.providerId, "credential"),
        ),
      )
      .limit(1);

    if (account) {
      await tx
        .update(schema.account)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(schema.account.id, account.id));
    } else {
      await tx.insert(schema.account).values({
        id: crypto.randomUUID(),
        accountId: parsed.targetUserId,
        providerId: "credential",
        userId: parsed.targetUserId,
        password: passwordHash,
      });
    }

    await tx
      .delete(schema.session)
      .where(eq(schema.session.userId, parsed.targetUserId));

    await tx.insert(schema.auditLogs).values({
      id: crypto.randomUUID(),
      performedBy: actor.id,
      resourceType: "user",
      resourceId: parsed.targetUserId,
      actionType: "user.password_reset",
      newData: { email: target.email },
    });
  });
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
