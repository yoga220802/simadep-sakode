import "@/src/infrastructure/server-only";

import {
  and,
  count,
  eq,
  gte,
  inArray,
  isNull,
  like,
  lte,
  or,
} from "drizzle-orm";

import { getDb, inTransaction, schema, type DatabaseTransaction } from "@/src/infrastructure/db";
import { timeQuery } from "@/src/infrastructure/db/query-timing";

import {
  assertCanAddProjectMember,
  assertCanArchiveProject,
  assertCanChangeProjectMemberRole,
  assertCanCreateProject,
  assertCanManageProject,
  assertCanManageProjectMembers,
  assertCanRemoveProjectMember,
  assertCanViewProject,
  assertOptimisticVersion,
  getDepartmentRole,
  getProjectRole,
  getProjectUiCapabilities,
  isGlobalProjectAdmin,
  type ProjectActor,
  type ProjectRole,
} from "../domain/project-policy";
import {
  addProjectMemberInputSchema,
  archiveProjectInputSchema,
  createProjectInputSchema,
  projectListInputSchema,
  removeProjectMemberInputSchema,
  updateProjectInputSchema,
  updateProjectMemberInputSchema,
  type AddProjectMemberInput,
  type ArchiveProjectInput,
  type AssignableProjectUserPage,
  type CreateProjectInput,
  type ProjectDetail,
  type ProjectListInput,
  type ProjectListItem,
  type ProjectMemberItem,
  type ProjectPage,
  type RemoveProjectMemberInput,
  type UpdateProjectInput,
  type UpdateProjectMemberInput,
} from "./contracts";

type ProjectRow = typeof schema.projects.$inferSelect;

async function getProjectOrThrow(projectId: string) {
  const [project] = await getDb()
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), isNull(schema.projects.deletedAt)))
    .limit(1);

  if (!project) {
    throw new Error("Project not found.");
  }

  return project;
}

async function getUserOrThrow(userId: string) {
  const [user] = await getDb()
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!user || user.banned) {
    throw new Error("User not found or inactive.");
  }

  return user;
}

async function assertUserIsActiveDepartmentMember(input: {
  departmentId: string;
  userId: string;
}) {
  const [membership] = await getDb()
    .select({ id: schema.departmentMembers.id })
    .from(schema.departmentMembers)
    .where(
      and(
        eq(schema.departmentMembers.departmentId, input.departmentId),
        eq(schema.departmentMembers.userId, input.userId),
        eq(schema.departmentMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("User harus menjadi anggota aktif departemen project.");
  }
}

async function getNotificationRecipients(projectId: string, actorId: string) {
  const members = await getDb()
    .select({ userId: schema.projectMembers.userId })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, projectId));

  return [...new Set(members.map((member) => member.userId).filter((id) => id !== actorId))];
}

async function getGlobalAdminIds(exceptUserId?: string) {
  const rows = await getDb()
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(
      and(
        inArray(schema.user.role, ["super_admin", "admin"]),
        eq(schema.user.banned, false),
      ),
    );

  return rows.map((row) => row.id).filter((id) => id !== exceptUserId);
}

async function appendProjectEffects(
  tx: DatabaseTransaction,
  input: {
    actorId: string;
    projectId: string;
    actionType: string;
    eventType: string;
    previousData?: unknown;
    newData?: unknown;
    notificationRecipients?: string[];
    notificationTitle?: string;
    notificationMessage?: string;
  },
) {
  await tx.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    performedBy: input.actorId,
    projectId: input.projectId,
    resourceType: "project",
    resourceId: input.projectId,
    actionType: input.actionType,
    previousData: input.previousData,
    newData: input.newData,
  });

  await tx.insert(schema.outboxEvents).values({
    id: crypto.randomUUID(),
    eventType: input.eventType,
    aggregateType: "project",
    aggregateId: input.projectId,
    payload: {
      actorId: input.actorId,
      projectId: input.projectId,
      actionType: input.actionType,
      previousData: input.previousData,
      newData: input.newData,
    },
  });

  const recipients = [...new Set(input.notificationRecipients ?? [])].filter(
    (recipientId) => recipientId !== input.actorId,
  );

  if (recipients.length > 0) {
    await tx.insert(schema.notifications).values(
      recipients.map((recipientId) => ({
        id: crypto.randomUUID(),
        recipientId,
        actorId: input.actorId,
        type: input.eventType,
        title: input.notificationTitle ?? "Project updated",
        message: input.notificationMessage ?? "A project was updated.",
        projectId: input.projectId,
      })),
    );
  }
}

function dateFromInput(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toProjectListItem(
  project: ProjectRow & { departmentName: string | null },
  actor: ProjectActor,
  counts: {
    totalTasks: number;
    memberCount: number;
  },
): ProjectListItem {
  return {
    id: project.id,
    departmentId: project.departmentId,
    departmentName: project.departmentName,
    title: project.title,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    createdBy: project.createdBy,
    version: project.version,
    totalTasks: counts.totalTasks,
    memberCount: counts.memberCount,
    actorRole: isGlobalProjectAdmin(actor.globalRole)
      ? actor.globalRole ?? null
      : getProjectRole(actor, project.id) ??
        getDepartmentRole(actor, project.departmentId) ??
        null,
    capabilities: getProjectUiCapabilities(actor, project),
  };
}

export async function getProjectActor(userId: string): Promise<ProjectActor> {
  const [user] = await getDb()
    .select({ id: schema.user.id, role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("Authenticated user not found.");
  }

  const [departmentMemberships, projectMemberships] = await Promise.all([
    getDb()
      .select({
        departmentId: schema.departmentMembers.departmentId,
        role: schema.departmentMembers.role,
        status: schema.departmentMembers.status,
      })
      .from(schema.departmentMembers)
      .where(eq(schema.departmentMembers.userId, userId)),
    getDb()
      .select({
        projectId: schema.projectMembers.projectId,
        role: schema.projectMembers.role,
      })
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.userId, userId)),
  ]);

  return {
    id: user.id,
    globalRole: user.role,
    departmentMemberships,
    projectMemberships,
  };
}

export async function listProjectDepartmentsForActor(actor: ProjectActor) {
  const activeDepartmentIds = actor.departmentMemberships
    .filter((membership) => membership.status === "active")
    .map((membership) => membership.departmentId);

  if (!isGlobalProjectAdmin(actor.globalRole) && activeDepartmentIds.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: schema.departments.id,
      name: schema.departments.name,
      code: schema.departments.code,
    })
    .from(schema.departments)
    .where(
      and(
        eq(schema.departments.status, "active"),
        isGlobalProjectAdmin(actor.globalRole)
          ? undefined
          : inArray(schema.departments.id, activeDepartmentIds),
      ),
    )
    .orderBy(schema.departments.name);
}

export async function listProjectsForActor(
  actor: ProjectActor,
  input: ProjectListInput = {},
): Promise<ProjectPage> {
  const filters = projectListInputSchema.parse(input);
  const scopedProjectIds = actor.projectMemberships.map((membership) => membership.projectId);
  const scopedDepartmentIds = actor.departmentMemberships
    .filter((membership) => membership.status === "active")
    .map((membership) => membership.departmentId);

  if (
    !isGlobalProjectAdmin(actor.globalRole) &&
    scopedProjectIds.length === 0 &&
    scopedDepartmentIds.length === 0
  ) {
    return {
      items: [],
      page: filters.page,
      pageSize: filters.pageSize,
      totalItems: 0,
      totalPages: 1,
      summary: { all: 0, tender: 0, active: 0, completed: 0, cancelled: 0 },
    };
  }

  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    throw new Error("Start date must be less than or equal to end date.");
  }

  const scopeClause = isGlobalProjectAdmin(actor.globalRole)
    ? undefined
    : or(
        scopedProjectIds.length
          ? inArray(schema.projects.id, scopedProjectIds)
          : undefined,
        scopedDepartmentIds.length
          ? inArray(schema.projects.departmentId, scopedDepartmentIds)
          : undefined,
      );
  const whereClause = and(
    isNull(schema.projects.deletedAt),
    scopeClause,
    filters.status ? eq(schema.projects.status, filters.status) : undefined,
    filters.departmentId
      ? eq(schema.projects.departmentId, filters.departmentId)
      : undefined,
    filters.search
      ? or(
          like(schema.projects.title, `%${filters.search}%`),
          like(schema.projects.description, `%${filters.search}%`),
        )
      : undefined,
    filters.startDate
      ? gte(schema.projects.startDate, new Date(`${filters.startDate}T00:00:00.000Z`))
      : undefined,
    filters.endDate
      ? lte(schema.projects.startDate, new Date(`${filters.endDate}T23:59:59.999Z`))
      : undefined,
  );

  const rows = await timeQuery("projects.listProjectsForActor.rows", () =>
    getDb()
      .select({
        id: schema.projects.id,
        legacyId: schema.projects.legacyId,
        departmentId: schema.projects.departmentId,
        departmentName: schema.departments.name,
        title: schema.projects.title,
        description: schema.projects.description,
        status: schema.projects.status,
        startDate: schema.projects.startDate,
        endDate: schema.projects.endDate,
        createdBy: schema.projects.createdBy,
        version: schema.projects.version,
        createdAt: schema.projects.createdAt,
        updatedAt: schema.projects.updatedAt,
        deletedAt: schema.projects.deletedAt,
      })
      .from(schema.projects)
      .leftJoin(schema.departments, eq(schema.departments.id, schema.projects.departmentId))
      .where(whereClause)
      .orderBy(schema.projects.updatedAt),
  );

  const projectIds = rows.map((row) => row.id);
  const [taskCounts, memberCounts] =
    projectIds.length > 0
      ? await Promise.all([
          timeQuery("projects.listProjectsForActor.taskCounts", () =>
            getDb()
              .select({ projectId: schema.tasks.projectId, value: count() })
              .from(schema.tasks)
              .where(inArray(schema.tasks.projectId, projectIds))
              .groupBy(schema.tasks.projectId),
          ),
          timeQuery("projects.listProjectsForActor.memberCounts", () =>
            getDb()
              .select({ projectId: schema.projectMembers.projectId, value: count() })
              .from(schema.projectMembers)
              .where(inArray(schema.projectMembers.projectId, projectIds))
              .groupBy(schema.projectMembers.projectId),
          ),
        ])
      : [[], []];

  const taskCountByProject = new Map(taskCounts.map((row) => [row.projectId, row.value]));
  const memberCountByProject = new Map(
    memberCounts.map((row) => [row.projectId, row.value]),
  );
  const allItems = rows.map((row) =>
    toProjectListItem(row, actor, {
      totalTasks: taskCountByProject.get(row.id) ?? 0,
      memberCount: memberCountByProject.get(row.id) ?? 0,
    }),
  );

  const start = (filters.page - 1) * filters.pageSize;
  const items = allItems.slice(start, start + filters.pageSize);
  const summary = allItems.reduce(
    (acc, item) => {
      acc.all += 1;
      acc[item.status as keyof typeof acc] += 1;
      return acc;
    },
    { all: 0, tender: 0, active: 0, completed: 0, cancelled: 0 },
  );

  return {
    items,
    page: filters.page,
    pageSize: filters.pageSize,
    totalItems: allItems.length,
    totalPages: Math.max(1, Math.ceil(allItems.length / filters.pageSize)),
    summary,
  };
}

export async function getProjectDetailForActor(
  actor: ProjectActor,
  projectId: string,
): Promise<ProjectDetail> {
  const project = await getProjectOrThrow(projectId);
  assertCanViewProject(actor, project);

  const [members, taskCountRows, completedRows, department] = await Promise.all([
    listProjectMembersForActor(actor, projectId),
    getDb()
      .select({ value: count() })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId)),
    getDb()
      .select({ value: count() })
      .from(schema.tasks)
      .where(
        and(eq(schema.tasks.projectId, projectId), eq(schema.tasks.status, "completed")),
      ),
    getDb()
      .select({ name: schema.departments.name })
      .from(schema.departments)
      .where(eq(schema.departments.id, project.departmentId))
      .limit(1),
  ]);

  return {
    ...toProjectListItem(
      { ...project, departmentName: department[0]?.name ?? null },
      actor,
      {
        totalTasks: taskCountRows[0]?.value ?? 0,
        memberCount: members.length,
      },
    ),
    members,
    completedTasks: completedRows[0]?.value ?? 0,
  };
}

export async function listProjectMembersForActor(
  actor: ProjectActor,
  projectId: string,
): Promise<ProjectMemberItem[]> {
  const project = await getProjectOrThrow(projectId);
  assertCanViewProject(actor, project);

  return getDb()
    .select({
      id: schema.projectMembers.id,
      userId: schema.projectMembers.userId,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.projectMembers.role,
      createdAt: schema.projectMembers.createdAt,
    })
    .from(schema.projectMembers)
    .leftJoin(schema.user, eq(schema.user.id, schema.projectMembers.userId))
    .where(eq(schema.projectMembers.projectId, projectId))
    .orderBy(schema.projectMembers.role, schema.user.name);
}

export async function listAssignableProjectUsers(
  actor: ProjectActor,
  projectId: string,
  input: { search?: string; page?: number; pageSize?: number } = {},
): Promise<AssignableProjectUserPage> {
  const project = await getProjectOrThrow(projectId);
  assertCanManageProjectMembers(actor, project);

  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize ?? 20)));
  const search = input.search?.trim();
  const existingProjectMembers = await getDb()
    .select({ userId: schema.projectMembers.userId })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, projectId));
  const existingProjectMemberIds = new Set(
    existingProjectMembers.map((member) => member.userId),
  );
  const rows = await getDb()
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
    })
    .from(schema.departmentMembers)
    .innerJoin(schema.user, eq(schema.user.id, schema.departmentMembers.userId))
    .where(
      and(
        eq(schema.departmentMembers.departmentId, project.departmentId),
        eq(schema.departmentMembers.status, "active"),
        eq(schema.user.banned, false),
        search
          ? or(
              like(schema.user.name, `%${search}%`),
              like(schema.user.email, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(schema.user.name);
  const assignableRows = rows.filter(
    (row) => !existingProjectMemberIds.has(row.id),
  );

  const start = (page - 1) * pageSize;

  return {
    items: assignableRows.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: assignableRows.length,
    totalPages: Math.max(1, Math.ceil(assignableRows.length / pageSize)),
  };
}

export async function createProject(actor: ProjectActor, input: CreateProjectInput) {
  const parsed = createProjectInputSchema.parse(input);
  assertCanCreateProject(actor, parsed.departmentId);
  const projectId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx.insert(schema.projects).values({
      id: projectId,
      departmentId: parsed.departmentId,
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
      startDate: dateFromInput(parsed.startDate),
      endDate: dateFromInput(parsed.endDate),
      createdBy: actor.id,
    });

    await tx.insert(schema.projectMembers).values({
      id: crypto.randomUUID(),
      projectId,
      userId: actor.id,
      role: "owner",
      createdBy: actor.id,
    });

    await appendProjectEffects(tx, {
      actorId: actor.id,
      projectId,
      actionType: "project.created",
      eventType: "project.created.v1",
      newData: parsed,
      notificationRecipients: await getGlobalAdminIds(actor.id),
      notificationTitle: "Project baru dibuat",
      notificationMessage: parsed.title,
    });
  });

  return projectId;
}

export async function updateProject(actor: ProjectActor, input: UpdateProjectInput) {
  const parsed = updateProjectInputSchema.parse(input);
  const current = await getProjectOrThrow(parsed.projectId);
  assertCanManageProject(actor, current);
  assertOptimisticVersion({
    currentVersion: current.version,
    expectedVersion: parsed.version,
  });
  const recipients = await getNotificationRecipients(parsed.projectId, actor.id);
  const nextVersion = current.version + 1;

  await inTransaction(async (tx) => {
    await tx
      .update(schema.projects)
      .set({
        title: parsed.title,
        description: parsed.description,
        status: parsed.status,
        startDate: dateFromInput(parsed.startDate),
        endDate: dateFromInput(parsed.endDate),
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, parsed.projectId));

    await appendProjectEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      actionType:
        current.status !== parsed.status ? "project.status_changed" : "project.updated",
      eventType:
        current.status !== parsed.status
          ? "project.status_changed.v1"
          : "project.updated.v1",
      previousData: {
        title: current.title,
        description: current.description,
        status: current.status,
        startDate: current.startDate,
        endDate: current.endDate,
        version: current.version,
      },
      newData: { ...parsed, version: nextVersion },
      notificationRecipients: recipients,
      notificationTitle: "Project diperbarui",
      notificationMessage: parsed.title,
    });
  });

  return { projectId: parsed.projectId, version: nextVersion };
}

export async function archiveProject(actor: ProjectActor, input: ArchiveProjectInput) {
  const parsed = archiveProjectInputSchema.parse(input);
  const current = await getProjectOrThrow(parsed.projectId);
  assertCanArchiveProject(actor, current);
  const recipients = await getNotificationRecipients(parsed.projectId, actor.id);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.projects)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.projects.id, parsed.projectId));

    await appendProjectEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      actionType: "project.archived",
      eventType: "project.archived.v1",
      previousData: { deletedAt: current.deletedAt },
      newData: { deletedAt: "now" },
      notificationRecipients: recipients,
      notificationTitle: "Project diarsipkan",
      notificationMessage: current.title,
    });
  });
}

export async function addProjectMember(
  actor: ProjectActor,
  input: AddProjectMemberInput,
) {
  const parsed = addProjectMemberInputSchema.parse(input);
  const project = await getProjectOrThrow(parsed.projectId);
  assertCanManageProjectMembers(actor, project);
  const targetUser = await getUserOrThrow(parsed.userId);
  await assertUserIsActiveDepartmentMember({
    departmentId: project.departmentId,
    userId: parsed.userId,
  });
  assertCanAddProjectMember({
    targetGlobalRole: targetUser.role,
    nextRole: parsed.role,
  });

  const [existing] = await getDb()
    .select()
    .from(schema.projectMembers)
    .where(
      and(
        eq(schema.projectMembers.projectId, parsed.projectId),
        eq(schema.projectMembers.userId, parsed.userId),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("User sudah menjadi anggota project.");
  }

  const memberId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx.insert(schema.projectMembers).values({
      id: memberId,
      projectId: parsed.projectId,
      userId: parsed.userId,
      role: parsed.role,
      createdBy: actor.id,
    });

    await appendProjectEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      actionType: "project.member_added",
      eventType: "project.member_added.v1",
      newData: parsed,
      notificationRecipients: [parsed.userId],
      notificationTitle: "Anda ditambahkan ke project",
      notificationMessage: project.title,
    });
  });

  return memberId;
}

export async function updateProjectMember(
  actor: ProjectActor,
  input: UpdateProjectMemberInput,
) {
  const parsed = updateProjectMemberInputSchema.parse(input);
  const project = await getProjectOrThrow(parsed.projectId);
  assertCanManageProjectMembers(actor, project);

  const [member] = await getDb()
    .select()
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.id, parsed.memberId))
    .limit(1);

  if (!member || member.projectId !== parsed.projectId) {
    throw new Error("Project member not found.");
  }

  const targetUser = await getUserOrThrow(member.userId);
  assertCanChangeProjectMemberRole({
    actorId: actor.id,
    targetUserId: member.userId,
    currentRole: member.role as ProjectRole,
    nextRole: parsed.role,
    targetGlobalRole: targetUser.role,
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.projectMembers)
      .set({ role: parsed.role, updatedAt: new Date() })
      .where(eq(schema.projectMembers.id, parsed.memberId));

    await appendProjectEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      actionType: "project.member_role_changed",
      eventType: "project.member_role_changed.v1",
      previousData: { role: member.role },
      newData: { role: parsed.role },
      notificationRecipients: [member.userId],
      notificationTitle: "Role project Anda diperbarui",
      notificationMessage: project.title,
    });
  });
}

export async function removeProjectMember(
  actor: ProjectActor,
  input: RemoveProjectMemberInput,
) {
  const parsed = removeProjectMemberInputSchema.parse(input);
  const project = await getProjectOrThrow(parsed.projectId);
  assertCanManageProjectMembers(actor, project);

  const [member] = await getDb()
    .select()
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.id, parsed.memberId))
    .limit(1);

  if (!member || member.projectId !== parsed.projectId) {
    throw new Error("Project member not found.");
  }

  assertCanRemoveProjectMember({
    actorId: actor.id,
    targetUserId: member.userId,
    targetRole: member.role as ProjectRole,
  });

  await inTransaction(async (tx) => {
    await tx
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.id, parsed.memberId));

    await appendProjectEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      actionType: "project.member_removed",
      eventType: "project.member_removed.v1",
      previousData: { role: member.role, userId: member.userId },
      notificationRecipients: [member.userId],
      notificationTitle: "Anda dihapus dari project",
      notificationMessage: project.title,
    });
  });
}
