import "@/src/infrastructure/server-only";

import { and, desc, eq, inArray, or } from "drizzle-orm";

import { getDb, schema } from "@/src/infrastructure/db";
import {
  isGlobalProjectAdmin,
  type ProjectActor,
} from "@/src/features/projects";

import {
  auditActivityInputSchema,
  type AuditActivityInput,
  type AuditActivityItem,
} from "./contracts";

function activeDepartmentIds(actor: ProjectActor) {
  return actor.departmentMemberships
    .filter((membership) => membership.status === "active")
    .map((membership) => membership.departmentId);
}

function scopedAuditClause(actor: ProjectActor) {
  if (isGlobalProjectAdmin(actor.globalRole)) {
    return undefined;
  }

  const projectIds = actor.projectMemberships.map((membership) => membership.projectId);
  const departmentIds = activeDepartmentIds(actor);

  return or(
    projectIds.length ? inArray(schema.auditLogs.projectId, projectIds) : undefined,
    departmentIds.length
      ? inArray(schema.auditLogs.departmentId, departmentIds)
      : undefined,
    eq(schema.auditLogs.performedBy, actor.id),
  );
}

export async function listAuditActivity(
  actor: ProjectActor,
  input: AuditActivityInput = {},
): Promise<AuditActivityItem[]> {
  const parsed = auditActivityInputSchema.parse(input);

  const rows = await getDb()
    .select({
      id: schema.auditLogs.id,
      actorId: schema.auditLogs.performedBy,
      actorName: schema.user.name,
      actorDisplayName: schema.userProfiles.displayName,
      actionType: schema.auditLogs.actionType,
      resourceType: schema.auditLogs.resourceType,
      resourceId: schema.auditLogs.resourceId,
      departmentId: schema.auditLogs.departmentId,
      departmentName: schema.departments.name,
      projectId: schema.auditLogs.projectId,
      projectTitle: schema.projects.title,
      taskId: schema.auditLogs.taskId,
      taskName: schema.tasks.name,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.user, eq(schema.user.id, schema.auditLogs.performedBy))
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .leftJoin(schema.departments, eq(schema.departments.id, schema.auditLogs.departmentId))
    .leftJoin(schema.projects, eq(schema.projects.id, schema.auditLogs.projectId))
    .leftJoin(schema.tasks, eq(schema.tasks.id, schema.auditLogs.taskId))
    .where(
      and(
        scopedAuditClause(actor),
        parsed.projectId ? eq(schema.auditLogs.projectId, parsed.projectId) : undefined,
        parsed.departmentId
          ? eq(schema.auditLogs.departmentId, parsed.departmentId)
          : undefined,
      ),
    )
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(parsed.limit);

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actorId,
    actorName: row.actorDisplayName ?? row.actorName ?? "Sistem",
    actionType: row.actionType,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    projectId: row.projectId,
    projectTitle: row.projectTitle,
    taskId: row.taskId,
    taskName: row.taskName,
    createdAt: row.createdAt.toISOString(),
  }));
}
