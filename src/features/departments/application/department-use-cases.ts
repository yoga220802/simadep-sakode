import "@/src/infrastructure/server-only";

import { and, count, eq, inArray, like, or } from "drizzle-orm";

import { getDb, inTransaction, schema } from "@/src/infrastructure/db";

import {
  assertCanArchiveDepartment,
  assertCanCreateDepartment,
  assertCanManageDepartment,
  assertCanManageDepartmentMembers,
  assertCanViewDepartment,
  assertDoesNotOrphanLastHead,
  getActiveDepartmentRole,
  isGlobalDepartmentAdmin,
  type DepartmentActor,
  type DepartmentRole,
} from "../domain/department-policy";
import {
  addDepartmentMemberInputSchema,
  archiveDepartmentInputSchema,
  createDepartmentInputSchema,
  departmentListInputSchema,
  removeDepartmentMemberInputSchema,
  updateDepartmentInputSchema,
  updateDepartmentMemberInputSchema,
  type AddDepartmentMemberInput,
  type ArchiveDepartmentInput,
  type CreateDepartmentInput,
  type DepartmentListInput,
  type DepartmentListItem,
  type DepartmentMemberItem,
  type RemoveDepartmentMemberInput,
  type UpdateDepartmentInput,
  type UpdateDepartmentMemberInput,
} from "./contracts";

async function ensureDepartmentExists(departmentId: string) {
  const [department] = await getDb()
    .select()
    .from(schema.departments)
    .where(eq(schema.departments.id, departmentId))
    .limit(1);

  if (!department) {
    throw new Error("Department not found.");
  }

  return department;
}

async function getActiveHeadCount(departmentId: string) {
  const [row] = await getDb()
    .select({ value: count() })
    .from(schema.departmentMembers)
    .where(
      and(
        eq(schema.departmentMembers.departmentId, departmentId),
        eq(schema.departmentMembers.role, "head"),
        eq(schema.departmentMembers.status, "active"),
      ),
    );

  return row?.value ?? 0;
}

async function assertDepartmentCodeAvailable(code: string, currentDepartmentId?: string) {
  const [existing] = await getDb()
    .select({ id: schema.departments.id })
    .from(schema.departments)
    .where(eq(schema.departments.code, code))
    .limit(1);

  if (existing && existing.id !== currentDepartmentId) {
    throw new Error("Kode departemen sudah digunakan.");
  }
}

async function appendAuditAndOutboxInTransaction(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  input: {
    actorId: string;
    departmentId: string;
    actionType: string;
    eventType: string;
    previousData?: unknown;
    newData?: unknown;
    resourceId?: string;
  },
) {
  await tx.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    performedBy: input.actorId,
    departmentId: input.departmentId,
    resourceType: "department",
    resourceId: input.resourceId ?? input.departmentId,
    actionType: input.actionType,
    previousData: input.previousData,
    newData: input.newData,
  });

  await tx.insert(schema.outboxEvents).values({
    id: crypto.randomUUID(),
    eventType: input.eventType,
    aggregateType: "department",
    aggregateId: input.departmentId,
    payload: {
      actorId: input.actorId,
      departmentId: input.departmentId,
      resourceId: input.resourceId ?? input.departmentId,
      actionType: input.actionType,
      previousData: input.previousData,
      newData: input.newData,
    },
  });
}

export async function getDepartmentActor(userId: string): Promise<DepartmentActor> {
  const [user] = await getDb()
    .select({
      id: schema.user.id,
      role: schema.user.role,
    })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("Authenticated user not found.");
  }

  const memberships = await getDb()
    .select({
      departmentId: schema.departmentMembers.departmentId,
      role: schema.departmentMembers.role,
      status: schema.departmentMembers.status,
    })
    .from(schema.departmentMembers)
    .where(eq(schema.departmentMembers.userId, userId));

  return {
    id: user.id,
    globalRole: user.role,
    memberships,
  };
}

export async function listDepartmentsForActor(
  actor: DepartmentActor,
  input: DepartmentListInput = {},
): Promise<DepartmentListItem[]> {
  const filters = departmentListInputSchema.parse(input);
  const db = getDb();

  const scopedDepartmentIds = actor.memberships
    .filter((membership) => membership.status === "active")
    .map((membership) => membership.departmentId);

  if (!isGlobalDepartmentAdmin(actor.globalRole) && scopedDepartmentIds.length === 0) {
    return [];
  }

  const whereClauses = [
    filters.status ? eq(schema.departments.status, filters.status) : undefined,
    filters.query
      ? or(
          like(schema.departments.name, `%${filters.query}%`),
          like(schema.departments.code, `%${filters.query}%`),
        )
      : undefined,
    isGlobalDepartmentAdmin(actor.globalRole)
      ? undefined
      : inArray(schema.departments.id, scopedDepartmentIds),
  ].filter(Boolean);

  const departments = await db
    .select()
    .from(schema.departments)
    .where(whereClauses.length ? and(...whereClauses) : undefined)
    .orderBy(schema.departments.name);

  if (departments.length === 0) {
    return [];
  }

  const departmentIds = departments.map((department) => department.id);
  const members = await db
    .select({
      departmentId: schema.departmentMembers.departmentId,
      role: schema.departmentMembers.role,
      status: schema.departmentMembers.status,
    })
    .from(schema.departmentMembers)
    .where(inArray(schema.departmentMembers.departmentId, departmentIds));

  return departments.map((department) => {
    const departmentMembers = members.filter(
      (member) => member.departmentId === department.id,
    );

    return {
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description,
      status: department.status,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      actorRole: isGlobalDepartmentAdmin(actor.globalRole)
        ? actor.globalRole ?? null
        : getActiveDepartmentRole(actor, department.id) ?? null,
      memberCount: departmentMembers.filter((member) => member.status === "active")
        .length,
      headCount: departmentMembers.filter(
        (member) => member.status === "active" && member.role === "head",
      ).length,
    };
  });
}

export async function listDepartmentMembersForActor(
  actor: DepartmentActor,
  departmentId: string,
): Promise<DepartmentMemberItem[]> {
  assertCanViewDepartment(actor, departmentId);

  return getDb()
    .select({
      id: schema.departmentMembers.id,
      departmentId: schema.departmentMembers.departmentId,
      userId: schema.departmentMembers.userId,
      role: schema.departmentMembers.role,
      status: schema.departmentMembers.status,
      displayName: schema.userProfiles.displayName,
      email: schema.user.email,
      joinedAt: schema.departmentMembers.joinedAt,
    })
    .from(schema.departmentMembers)
    .leftJoin(
      schema.userProfiles,
      eq(schema.userProfiles.userId, schema.departmentMembers.userId),
    )
    .leftJoin(schema.user, eq(schema.user.id, schema.departmentMembers.userId))
    .where(eq(schema.departmentMembers.departmentId, departmentId))
    .orderBy(schema.departmentMembers.role, schema.userProfiles.displayName);
}

export async function listDepartmentAssignableUsers(actor: DepartmentActor) {
  if (!isGlobalDepartmentAdmin(actor.globalRole) && actor.memberships.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      displayName: schema.userProfiles.displayName,
      role: schema.user.role,
      banned: schema.user.banned,
    })
    .from(schema.user)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .where(eq(schema.user.banned, false))
    .orderBy(schema.user.name);
}

export async function createDepartment(
  actor: DepartmentActor,
  input: CreateDepartmentInput,
) {
  assertCanCreateDepartment(actor);
  const parsed = createDepartmentInputSchema.parse(input);
  await assertDepartmentCodeAvailable(parsed.code);
  const departmentId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx.insert(schema.departments).values({
      id: departmentId,
      code: parsed.code,
      name: parsed.name,
      description: parsed.description,
      createdBy: actor.id,
    });

    await appendAuditAndOutboxInTransaction(tx, {
      actorId: actor.id,
      departmentId,
      actionType: "department.created",
      eventType: "department.created.v1",
      newData: parsed,
    });
  });

  return departmentId;
}

export async function updateDepartment(
  actor: DepartmentActor,
  input: UpdateDepartmentInput,
) {
  const parsed = updateDepartmentInputSchema.parse(input);
  const current = await ensureDepartmentExists(parsed.departmentId);
  assertCanManageDepartment(actor, parsed.departmentId);
  await assertDepartmentCodeAvailable(parsed.code, parsed.departmentId);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.departments)
      .set({
        code: parsed.code,
        name: parsed.name,
        description: parsed.description,
        updatedAt: new Date(),
      })
      .where(eq(schema.departments.id, parsed.departmentId));

    await appendAuditAndOutboxInTransaction(tx, {
      actorId: actor.id,
      departmentId: parsed.departmentId,
      actionType: "department.updated",
      eventType: "department.updated.v1",
      previousData: {
        code: current.code,
        name: current.name,
        description: current.description,
      },
      newData: parsed,
    });
  });
}

export async function archiveDepartment(
  actor: DepartmentActor,
  input: ArchiveDepartmentInput,
) {
  const parsed = archiveDepartmentInputSchema.parse(input);
  const current = await ensureDepartmentExists(parsed.departmentId);
  assertCanArchiveDepartment(actor, parsed.departmentId);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.departments)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.departments.id, parsed.departmentId));

    await appendAuditAndOutboxInTransaction(tx, {
      actorId: actor.id,
      departmentId: parsed.departmentId,
      actionType: "department.archived",
      eventType: "department.archived.v1",
      previousData: { status: current.status },
      newData: { status: "archived" },
    });
  });
}

export async function addDepartmentMember(
  actor: DepartmentActor,
  input: AddDepartmentMemberInput,
) {
  const parsed = addDepartmentMemberInputSchema.parse(input);
  await ensureDepartmentExists(parsed.departmentId);
  assertCanManageDepartmentMembers(actor, parsed.departmentId);

  const [existingMember] = await getDb()
    .select()
    .from(schema.departmentMembers)
    .where(
      and(
        eq(schema.departmentMembers.departmentId, parsed.departmentId),
        eq(schema.departmentMembers.userId, parsed.userId),
      ),
    )
    .limit(1);

  if (existingMember) {
    await updateDepartmentMember(actor, {
      departmentId: parsed.departmentId,
      memberId: existingMember.id,
      role: parsed.role,
      status: "active",
    });
    return existingMember.id;
  }

  const memberId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx.insert(schema.departmentMembers).values({
      id: memberId,
      departmentId: parsed.departmentId,
      userId: parsed.userId,
      role: parsed.role,
    });

    await appendAuditAndOutboxInTransaction(tx, {
      actorId: actor.id,
      departmentId: parsed.departmentId,
      resourceId: memberId,
      actionType: "department.member_added",
      eventType: "department.member_added.v1",
      newData: parsed,
    });
  });

  return memberId;
}

export async function updateDepartmentMember(
  actor: DepartmentActor,
  input: UpdateDepartmentMemberInput,
) {
  const parsed = updateDepartmentMemberInputSchema.parse(input);
  assertCanManageDepartmentMembers(actor, parsed.departmentId);

  const [member] = await getDb()
    .select()
    .from(schema.departmentMembers)
    .where(eq(schema.departmentMembers.id, parsed.memberId))
    .limit(1);

  if (!member || member.departmentId !== parsed.departmentId) {
    throw new Error("Department member not found.");
  }

  assertDoesNotOrphanLastHead({
    targetRole: member.role as DepartmentRole,
    nextRole: parsed.status === "active" ? parsed.role : undefined,
    activeHeadCount: await getActiveHeadCount(parsed.departmentId),
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.departmentMembers)
      .set({
        role: parsed.role,
        status: parsed.status,
        endedAt: parsed.status === "inactive" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.departmentMembers.id, parsed.memberId));

    await appendAuditAndOutboxInTransaction(tx, {
      actorId: actor.id,
      departmentId: parsed.departmentId,
      resourceId: parsed.memberId,
      actionType: "department.member_updated",
      eventType: "department.member_updated.v1",
      previousData: { role: member.role, status: member.status },
      newData: { role: parsed.role, status: parsed.status },
    });
  });
}

export async function removeDepartmentMember(
  actor: DepartmentActor,
  input: RemoveDepartmentMemberInput,
) {
  const parsed = removeDepartmentMemberInputSchema.parse(input);
  assertCanManageDepartmentMembers(actor, parsed.departmentId);

  const [member] = await getDb()
    .select()
    .from(schema.departmentMembers)
    .where(eq(schema.departmentMembers.id, parsed.memberId))
    .limit(1);

  if (!member || member.departmentId !== parsed.departmentId) {
    throw new Error("Department member not found.");
  }

  assertDoesNotOrphanLastHead({
    targetRole: member.role as DepartmentRole,
    activeHeadCount: await getActiveHeadCount(parsed.departmentId),
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.departmentMembers)
      .set({
        status: "inactive",
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.departmentMembers.id, parsed.memberId));

    await appendAuditAndOutboxInTransaction(tx, {
      actorId: actor.id,
      departmentId: parsed.departmentId,
      resourceId: parsed.memberId,
      actionType: "department.member_removed",
      eventType: "department.member_removed.v1",
      previousData: { role: member.role, status: member.status },
      newData: { status: "inactive" },
    });
  });
}
