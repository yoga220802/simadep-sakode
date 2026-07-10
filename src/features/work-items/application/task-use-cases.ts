import "@/src/infrastructure/server-only";

import { eq } from "drizzle-orm";

import { inTransaction, schema } from "@/src/infrastructure/db";
import type { ProjectActor } from "@/src/features/projects";

import {
  assertCanManageWorkItems,
  assertOptimisticTaskVersion,
  assertTaskRelationProject,
  type TaskStatus,
} from "../domain/work-item-policy";
import {
  createSubtaskInputSchema,
  createTaskInputSchema,
  deleteTaskInputSchema,
  updateTaskInputSchema,
  type CreateSubtaskInput,
  type CreateTaskInput,
  type DeleteTaskInput,
  type UpdateTaskInput,
} from "./contracts";
import {
  appendWorkItemEffects,
  completionFields,
  dateFromInput,
  getCategoryOrThrow,
  getMilestoneOrThrow,
  getNextTaskOrder,
  getProjectMemberUserIds,
  getProjectOrThrow,
  getTaskOrThrow,
} from "./work-item-internals";

async function ensureCategoryInProject(categoryId: string | undefined, projectId: string) {
  if (!categoryId) {
    return null;
  }

  const category = await getCategoryOrThrow(categoryId);
  assertTaskRelationProject({
    relationProjectId: category.projectId,
    taskProjectId: projectId,
    relationName: "Category",
  });
  return category;
}

async function getProjectRecipients(projectId: string, actorId: string) {
  return (await getProjectMemberUserIds(projectId)).filter((userId) => userId !== actorId);
}

export async function createTask(actor: ProjectActor, input: CreateTaskInput) {
  const parsed = createTaskInputSchema.parse(input);
  const milestone = await getMilestoneOrThrow(parsed.milestoneId);
  const project = await getProjectOrThrow(milestone.projectId);
  assertCanManageWorkItems(actor, project);
  await ensureCategoryInProject(parsed.categoryId, project.id);

  const taskId = crypto.randomUUID();
  const displayOrder =
    parsed.displayOrder ??
    (await getNextTaskOrder({ milestoneId: milestone.id, parentId: null }));
  const startDate = dateFromInput(parsed.startDate);
  const dueDate = dateFromInput(parsed.dueDate);
  const completed = completionFields({
    status: parsed.status,
    startedAt: startDate,
  });

  await inTransaction(async (tx) => {
    await tx.insert(schema.tasks).values({
      id: taskId,
      projectId: project.id,
      milestoneId: milestone.id,
      categoryId: parsed.categoryId ?? null,
      name: parsed.name,
      description: parsed.description,
      status: parsed.status,
      priority: parsed.priority,
      displayOrder,
      startDate,
      dueDate,
      estimatedDurationMinutes: parsed.estimatedDurationMinutes,
      completedAt: completed.completedAt,
      finishedDurationMinutes: completed.finishedDurationMinutes,
      createdBy: actor.id,
    });

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: project.id,
      taskId,
      resourceType: "task",
      resourceId: taskId,
      actionType: "task.created",
      eventType: "task.created.v1",
      newData: { ...parsed, displayOrder },
      notificationRecipients: await getProjectRecipients(project.id, actor.id),
      notificationTitle: "Tugas baru dibuat",
      notificationMessage: parsed.name,
    });
  });

  return taskId;
}

export async function createSubtask(actor: ProjectActor, input: CreateSubtaskInput) {
  const parsed = createSubtaskInputSchema.parse(input);
  const parent = await getTaskOrThrow(parsed.parentTaskId);
  const project = await getProjectOrThrow(parent.projectId);
  assertCanManageWorkItems(actor, project);
  await ensureCategoryInProject(parsed.categoryId, project.id);

  const taskId = crypto.randomUUID();
  const displayOrder =
    parsed.displayOrder ??
    (await getNextTaskOrder({
      milestoneId: parent.milestoneId,
      parentId: parent.id,
    }));
  const startDate = dateFromInput(parsed.startDate);
  const dueDate = dateFromInput(parsed.dueDate);
  const completed = completionFields({ status: parsed.status, startedAt: startDate });

  await inTransaction(async (tx) => {
    await tx.insert(schema.tasks).values({
      id: taskId,
      projectId: project.id,
      milestoneId: parent.milestoneId,
      parentId: parent.id,
      categoryId: parsed.categoryId ?? null,
      name: parsed.name,
      description: parsed.description,
      status: parsed.status,
      priority: parsed.priority,
      displayOrder,
      startDate,
      dueDate,
      estimatedDurationMinutes: parsed.estimatedDurationMinutes,
      completedAt: completed.completedAt,
      finishedDurationMinutes: completed.finishedDurationMinutes,
      createdBy: actor.id,
    });

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: project.id,
      taskId,
      resourceType: "task",
      resourceId: taskId,
      actionType: "task.subtask_created",
      eventType: "task.subtask_created.v1",
      previousData: { parentTaskId: parent.id },
      newData: { ...parsed, displayOrder },
      notificationRecipients: await getProjectRecipients(project.id, actor.id),
      notificationTitle: "Subtask baru dibuat",
      notificationMessage: parsed.name,
    });
  });

  return taskId;
}

export async function updateTask(actor: ProjectActor, input: UpdateTaskInput) {
  const parsed = updateTaskInputSchema.parse(input);
  const task = await getTaskOrThrow(parsed.taskId);
  const project = await getProjectOrThrow(task.projectId);
  assertCanManageWorkItems(actor, project);
  assertOptimisticTaskVersion({
    currentVersion: task.version,
    expectedVersion: parsed.version,
  });

  const milestoneId = parsed.milestoneId ?? task.milestoneId;
  const milestone = await getMilestoneOrThrow(milestoneId);
  assertTaskRelationProject({
    relationProjectId: milestone.projectId,
    taskProjectId: task.projectId,
    relationName: "Milestone",
  });
  await ensureCategoryInProject(parsed.categoryId, task.projectId);

  const nextStatus = (parsed.status ?? task.status) as TaskStatus;
  const startDate = dateFromInput(parsed.startDate) ?? task.startDate;
  const completed = completionFields({
    status: nextStatus,
    previousStatus: task.status,
    startedAt: startDate,
    createdAt: task.createdAt,
  });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.tasks)
      .set({
        milestoneId,
        categoryId: parsed.categoryId ?? null,
        name: parsed.name,
        description: parsed.description,
        status: nextStatus,
        priority: parsed.priority,
        displayOrder: parsed.displayOrder ?? task.displayOrder,
        startDate,
        dueDate: dateFromInput(parsed.dueDate),
        estimatedDurationMinutes: parsed.estimatedDurationMinutes,
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
      actionType: task.status !== nextStatus ? "task.status_changed" : "task.updated",
      eventType:
        task.status !== nextStatus ? "task.status_changed.v1" : "task.updated.v1",
      previousData: {
        name: task.name,
        status: task.status,
        version: task.version,
      },
      newData: { ...parsed, status: nextStatus, version: task.version + 1 },
      notificationRecipients: await getProjectRecipients(task.projectId, actor.id),
      notificationTitle: "Tugas diperbarui",
      notificationMessage: parsed.name,
    });
  });
}

export async function deleteTask(actor: ProjectActor, input: DeleteTaskInput) {
  const parsed = deleteTaskInputSchema.parse(input);
  const task = await getTaskOrThrow(parsed.taskId);
  const project = await getProjectOrThrow(task.projectId);
  assertCanManageWorkItems(actor, project);

  await inTransaction(async (tx) => {
    await tx.delete(schema.tasks).where(eq(schema.tasks.id, task.id));
    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: task.projectId,
      taskId: task.id,
      resourceType: "task",
      resourceId: task.id,
      actionType: "task.deleted",
      eventType: "task.deleted.v1",
      previousData: task,
      notificationRecipients: await getProjectRecipients(task.projectId, actor.id),
      notificationTitle: "Tugas dihapus",
      notificationMessage: task.name,
    });
  });
}
