import "@/src/infrastructure/server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import {
  getDb,
  schema,
  type DatabaseTransaction,
} from "@/src/infrastructure/db";
import type { ProjectActor } from "@/src/features/projects";

import {
  assertCanViewWorkItems,
  defaultTaskStatusLabels,
  isCompletedStatus,
  taskStatuses,
  type TaskStatus,
} from "../domain/work-item-policy";
import type { WorkItemStatus, WorkItemTask } from "./contracts";

export type ProjectRef = typeof schema.projects.$inferSelect;
export type TaskRow = typeof schema.tasks.$inferSelect;
export type MilestoneRow = typeof schema.milestones.$inferSelect;
export type CategoryRow = typeof schema.taskCategories.$inferSelect;

export function dateFromInput(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function getProjectOrThrow(projectId: string) {
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

export async function getMilestoneOrThrow(milestoneId: string) {
  const [milestone] = await getDb()
    .select()
    .from(schema.milestones)
    .where(eq(schema.milestones.id, milestoneId))
    .limit(1);

  if (!milestone) {
    throw new Error("Milestone not found.");
  }

  return milestone;
}

export async function getTaskOrThrow(taskId: string) {
  const [task] = await getDb()
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .limit(1);

  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
}

export async function getCategoryOrThrow(categoryId: string) {
  const [category] = await getDb()
    .select()
    .from(schema.taskCategories)
    .where(eq(schema.taskCategories.id, categoryId))
    .limit(1);

  if (!category) {
    throw new Error("Category not found.");
  }

  return category;
}

export async function getNextMilestoneOrder(projectId: string) {
  const [row] = await getDb()
    .select({ value: sql<number>`coalesce(max(${schema.milestones.displayOrder}), 0)` })
    .from(schema.milestones)
    .where(eq(schema.milestones.projectId, projectId));

  return Number(row?.value ?? 0) + 1;
}

export async function getNextTaskOrder(input: {
  milestoneId: string;
  parentId?: string | null;
}) {
  const [row] = await getDb()
    .select({ value: sql<number>`coalesce(max(${schema.tasks.displayOrder}), 0)` })
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.milestoneId, input.milestoneId),
        input.parentId
          ? eq(schema.tasks.parentId, input.parentId)
          : isNull(schema.tasks.parentId),
      ),
    );

  return Number(row?.value ?? 0) + 1;
}

export async function getProjectMemberUserIds(projectId: string) {
  const rows = await getDb()
    .select({ userId: schema.projectMembers.userId })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, projectId));

  return rows.map((row) => row.userId);
}

export function defaultWorkItemStatuses(): WorkItemStatus[] {
  return taskStatuses.map((status, index) => ({
    value: status,
    label: defaultTaskStatusLabels[status],
    displayOrder: index + 1,
    isDefault: true,
  }));
}

export function slugifyStatusLabel(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || `status_${crypto.randomUUID().slice(0, 8)}`;
}

export async function getProjectTaskStatuses(projectId: string) {
  const customStatuses = await getDb()
    .select({
      value: schema.projectTaskStatuses.value,
      label: schema.projectTaskStatuses.label,
      displayOrder: schema.projectTaskStatuses.displayOrder,
    })
    .from(schema.projectTaskStatuses)
    .where(eq(schema.projectTaskStatuses.projectId, projectId))
    .orderBy(schema.projectTaskStatuses.displayOrder, schema.projectTaskStatuses.label);

  return [
    ...defaultWorkItemStatuses(),
    ...customStatuses.map((status) => ({
      ...status,
      isDefault: false,
    })),
  ];
}

export async function assertTaskStatusInProject(status: string, projectId: string) {
  const statuses = await getProjectTaskStatuses(projectId);
  if (!statuses.some((option) => option.value === status)) {
    throw new Error("Status tugas tidak tersedia untuk project ini.");
  }
}

export async function getTaskAssigneeUserIds(taskId: string) {
  const rows = await getDb()
    .select({ userId: schema.taskAssignees.userId })
    .from(schema.taskAssignees)
    .where(eq(schema.taskAssignees.taskId, taskId));

  return rows.map((row) => row.userId);
}

export async function ensureProjectVisible(actor: ProjectActor, projectId: string) {
  const project = await getProjectOrThrow(projectId);
  assertCanViewWorkItems(actor, project);
  return project;
}

export function completionFields(input: {
  status: TaskStatus;
  previousStatus?: string | null;
  startedAt?: Date | null;
  createdAt?: Date | null;
}) {
  if (!isCompletedStatus(input.status)) {
    return {
      completedAt: null,
      finishedDurationMinutes: null,
    };
  }

  if (input.previousStatus === "completed") {
    return {};
  }

  const completedAt = new Date();
  const baseline = input.startedAt ?? input.createdAt ?? completedAt;
  const finishedDurationMinutes = Math.max(
    0,
    Math.round((completedAt.getTime() - baseline.getTime()) / 60000),
  );

  return { completedAt, finishedDurationMinutes };
}

export async function appendWorkItemEffects(
  tx: DatabaseTransaction,
  input: {
    actorId: string;
    projectId: string;
    taskId?: string;
    resourceType:
      | "milestone"
      | "task"
      | "task_category"
      | "task_status"
      | "task_assignee";
    resourceId: string;
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
    taskId: input.taskId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    actionType: input.actionType,
    previousData: input.previousData,
    newData: input.newData,
  });

  await tx.insert(schema.outboxEvents).values({
    id: crypto.randomUUID(),
    eventType: input.eventType,
    aggregateType: input.resourceType,
    aggregateId: input.resourceId,
    payload: {
      actorId: input.actorId,
      projectId: input.projectId,
      taskId: input.taskId,
      resourceId: input.resourceId,
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
        title: input.notificationTitle ?? "Work item updated",
        message: input.notificationMessage ?? "A work item was updated.",
        projectId: input.projectId,
        taskId: input.taskId,
      })),
    );
  }
}

export function buildTaskTree(
  tasks: WorkItemTask[],
  parentId: string | null = null,
): WorkItemTask[] {
  return tasks
    .filter((task) => task.parentId === parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    .map((task) => ({
      ...task,
      subtasks: buildTaskTree(tasks, task.id),
    }));
}

export function filterTaskIdsByAssignee(input: {
  assignedToMe?: boolean;
  actorId: string;
  assignees: Array<{ taskId: string; userId: string }>;
}) {
  if (!input.assignedToMe) {
    return undefined;
  }

  return new Set(
    input.assignees
      .filter((assignee) => assignee.userId === input.actorId)
      .map((assignee) => assignee.taskId),
  );
}

export async function getProjectMembersForDisplay(projectId: string) {
  return getDb()
    .select({
      userId: schema.projectMembers.userId,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.projectMembers.role,
    })
    .from(schema.projectMembers)
    .leftJoin(schema.user, eq(schema.user.id, schema.projectMembers.userId))
    .where(eq(schema.projectMembers.projectId, projectId))
    .orderBy(schema.projectMembers.role, schema.user.name);
}

export async function getTaskAssigneesForTasks(taskIds: string[]) {
  if (taskIds.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: schema.taskAssignees.id,
      taskId: schema.taskAssignees.taskId,
      userId: schema.taskAssignees.userId,
      name: schema.user.name,
      email: schema.user.email,
    })
    .from(schema.taskAssignees)
    .leftJoin(schema.user, eq(schema.user.id, schema.taskAssignees.userId))
    .where(inArray(schema.taskAssignees.taskId, taskIds));
}
