import "@/src/infrastructure/server-only";

import { and, eq } from "drizzle-orm";

import { getDb, inTransaction, schema } from "@/src/infrastructure/db";
import type { ProjectActor } from "@/src/features/projects";

import {
  assertAssigneeIsProjectMember,
  assertCanManageWorkItems,
  assertCanUseAssignedStatusAction,
  assertOptimisticTaskVersion,
} from "../domain/work-item-policy";
import {
  assignTaskInputSchema,
  changeTaskStatusInputSchema,
  unassignTaskInputSchema,
  type AssignTaskInput,
  type ChangeTaskStatusInput,
  type UnassignTaskInput,
} from "./contracts";
import {
  appendWorkItemEffects,
  assertTaskStatusInProject,
  completionFields,
  getProjectMemberUserIds,
  getProjectOrThrow,
  getTaskAssigneeUserIds,
  getTaskOrThrow,
} from "./work-item-internals";

async function getProjectRecipients(projectId: string, actorId: string) {
  return (await getProjectMemberUserIds(projectId)).filter((userId) => userId !== actorId);
}

export async function assignTask(actor: ProjectActor, input: AssignTaskInput) {
  const parsed = assignTaskInputSchema.parse(input);
  const task = await getTaskOrThrow(parsed.taskId);
  const project = await getProjectOrThrow(task.projectId);
  assertCanManageWorkItems(actor, project);

  assertAssigneeIsProjectMember({
    targetUserId: parsed.userId,
    projectMemberUserIds: await getProjectMemberUserIds(project.id),
  });

  const [existing] = await getDb()
    .select()
    .from(schema.taskAssignees)
    .where(
      and(
        eq(schema.taskAssignees.taskId, task.id),
        eq(schema.taskAssignees.userId, parsed.userId),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("User is already assigned to this task.");
  }

  const assignmentId = crypto.randomUUID();
  await inTransaction(async (tx) => {
    await tx.insert(schema.taskAssignees).values({
      id: assignmentId,
      taskId: task.id,
      userId: parsed.userId,
      assignedBy: actor.id,
    });

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: task.projectId,
      taskId: task.id,
      resourceType: "task_assignee",
      resourceId: assignmentId,
      actionType: "task.assignee_added",
      eventType: "task.assignee_added.v1",
      newData: parsed,
      notificationRecipients: [parsed.userId],
      notificationTitle: "Anda ditugaskan ke task",
      notificationMessage: task.name,
    });
  });

  return assignmentId;
}

export async function unassignTask(actor: ProjectActor, input: UnassignTaskInput) {
  const parsed = unassignTaskInputSchema.parse(input);
  const task = await getTaskOrThrow(parsed.taskId);
  const project = await getProjectOrThrow(task.projectId);
  assertCanManageWorkItems(actor, project);

  const [assignment] = await getDb()
    .select()
    .from(schema.taskAssignees)
    .where(
      and(
        eq(schema.taskAssignees.taskId, task.id),
        eq(schema.taskAssignees.userId, parsed.userId),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error("Task assignment not found.");
  }

  await inTransaction(async (tx) => {
    await tx
      .delete(schema.taskAssignees)
      .where(eq(schema.taskAssignees.id, assignment.id));
    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: task.projectId,
      taskId: task.id,
      resourceType: "task_assignee",
      resourceId: assignment.id,
      actionType: "task.assignee_removed",
      eventType: "task.assignee_removed.v1",
      previousData: assignment,
      notificationRecipients: [parsed.userId],
      notificationTitle: "Penugasan task dilepas",
      notificationMessage: task.name,
    });
  });
}

export async function changeTaskStatus(
  actor: ProjectActor,
  input: ChangeTaskStatusInput,
) {
  const parsed = changeTaskStatusInputSchema.parse(input);
  const task = await getTaskOrThrow(parsed.taskId);
  const project = await getProjectOrThrow(task.projectId);
  const assigneeUserIds = await getTaskAssigneeUserIds(task.id);
  assertCanUseAssignedStatusAction({ actor, project, assigneeUserIds });
  assertOptimisticTaskVersion({
    currentVersion: task.version,
    expectedVersion: parsed.version,
  });
  await assertTaskStatusInProject(parsed.status, task.projectId);

  const completed = completionFields({
    status: parsed.status,
    previousStatus: task.status,
    startedAt: task.startDate,
    createdAt: task.createdAt,
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.tasks)
      .set({
        status: parsed.status,
        ...completed,
        version: task.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.tasks.id, task.id));

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: task.projectId,
      taskId: task.id,
      resourceType: "task",
      resourceId: task.id,
      actionType: "task.status_changed",
      eventType: "task.status_changed.v1",
      previousData: {
        status: task.status,
        version: task.version,
      },
      newData: {
        status: parsed.status,
        version: task.version + 1,
      },
      notificationRecipients: await getProjectRecipients(task.projectId, actor.id),
      notificationTitle: "Status tugas berubah",
      notificationMessage: task.name,
    });
  });
}
