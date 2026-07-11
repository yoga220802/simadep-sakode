import type { ProjectActor, ProjectRole } from "@/src/features/projects";
import {
  canManageProject,
  canViewProject,
  getProjectRole,
  isGlobalProjectAdmin,
} from "@/src/features/projects";

export const taskStatuses = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const defaultTaskStatusLabels: Record<(typeof taskStatuses)[number], string> = {
  pending: "Belum Mulai",
  in_progress: "Berjalan",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const taskPriorities = ["low", "medium", "high"] as const;

export type TaskStatus = string;
export type TaskPriority = (typeof taskPriorities)[number];

export type WorkItemProjectRef = {
  id: string;
  departmentId: string;
};

export function canManageWorkItems(
  actor: ProjectActor,
  project: WorkItemProjectRef,
) {
  return canManageProject(actor, project);
}

export function assertCanViewWorkItems(
  actor: ProjectActor,
  project: WorkItemProjectRef,
) {
  if (!canViewProject(actor, project)) {
    throw new Error("You do not have access to these work items.");
  }
}

export function assertCanManageWorkItems(
  actor: ProjectActor,
  project: WorkItemProjectRef,
) {
  if (!canManageWorkItems(actor, project)) {
    throw new Error("You cannot manage work items in this project.");
  }
}

export function assertCanUseAssignedStatusAction(input: {
  actor: ProjectActor;
  project: WorkItemProjectRef;
  assigneeUserIds: string[];
}) {
  if (canManageWorkItems(input.actor, input.project)) {
    return;
  }

  if (!input.assigneeUserIds.includes(input.actor.id)) {
    throw new Error("Only assigned users can change this task status.");
  }
}

export function assertAssigneeIsProjectMember(input: {
  targetUserId: string;
  projectMemberUserIds: string[];
}) {
  if (!input.projectMemberUserIds.includes(input.targetUserId)) {
    throw new Error("Task assignee must already be a project member.");
  }
}

export function assertTaskRelationProject(input: {
  relationProjectId: string;
  taskProjectId: string;
  relationName: string;
}) {
  if (input.relationProjectId !== input.taskProjectId) {
    throw new Error(`${input.relationName} must belong to the same project.`);
  }
}

export function assertOptimisticTaskVersion(input: {
  currentVersion: number;
  expectedVersion: number;
}) {
  if (input.currentVersion !== input.expectedVersion) {
    throw new Error("Task was updated by another session. Refresh and try again.");
  }
}

export function isCompletedStatus(status: TaskStatus) {
  return status === "completed";
}

export function isPrivilegedProjectRole(role?: ProjectRole | string | null) {
  return (
    role === "owner" ||
    role === "manager" ||
    role === "head" ||
    role === "department_admin" ||
    role === "admin" ||
    role === "super_admin"
  );
}

export function getWorkItemActorProjectRole(
  actor: ProjectActor,
  projectId: string,
) {
  if (isGlobalProjectAdmin(actor.globalRole)) {
    return actor.globalRole ?? null;
  }

  return getProjectRole(actor, projectId) ?? null;
}
