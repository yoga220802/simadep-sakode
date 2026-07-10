import "@/src/infrastructure/server-only";

import { and, count, eq, inArray } from "drizzle-orm";

import { getDb, inTransaction, schema } from "@/src/infrastructure/db";
import type { ProjectActor } from "@/src/features/projects";

import { assertCanManageWorkItems } from "../domain/work-item-policy";
import {
  createCategoryInputSchema,
  createMilestoneInputSchema,
  deleteCategoryInputSchema,
  deleteMilestoneInputSchema,
  reorderMilestonesInputSchema,
  updateCategoryInputSchema,
  updateMilestoneInputSchema,
  type CreateCategoryInput,
  type CreateMilestoneInput,
  type DeleteCategoryInput,
  type DeleteMilestoneInput,
  type ReorderMilestonesInput,
  type UpdateCategoryInput,
  type UpdateMilestoneInput,
} from "./contracts";
import {
  appendWorkItemEffects,
  getCategoryOrThrow,
  getMilestoneOrThrow,
  getNextMilestoneOrder,
  getProjectOrThrow,
} from "./work-item-internals";

export async function createMilestone(
  actor: ProjectActor,
  input: CreateMilestoneInput,
) {
  const parsed = createMilestoneInputSchema.parse(input);
  const project = await getProjectOrThrow(parsed.projectId);
  assertCanManageWorkItems(actor, project);

  const milestoneId = crypto.randomUUID();
  const displayOrder = await getNextMilestoneOrder(parsed.projectId);

  await inTransaction(async (tx) => {
    await tx.insert(schema.milestones).values({
      id: milestoneId,
      projectId: parsed.projectId,
      title: parsed.title,
      displayOrder,
    });

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      resourceType: "milestone",
      resourceId: milestoneId,
      actionType: "milestone.created",
      eventType: "milestone.created.v1",
      newData: { ...parsed, displayOrder },
    });
  });

  return milestoneId;
}

export async function updateMilestone(
  actor: ProjectActor,
  input: UpdateMilestoneInput,
) {
  const parsed = updateMilestoneInputSchema.parse(input);
  const milestone = await getMilestoneOrThrow(parsed.milestoneId);
  const project = await getProjectOrThrow(milestone.projectId);
  assertCanManageWorkItems(actor, project);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.milestones)
      .set({
        title: parsed.title ?? milestone.title,
        displayOrder: parsed.displayOrder ?? milestone.displayOrder,
        updatedAt: new Date(),
      })
      .where(eq(schema.milestones.id, parsed.milestoneId));

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: milestone.projectId,
      resourceType: "milestone",
      resourceId: milestone.id,
      actionType: "milestone.updated",
      eventType: "milestone.updated.v1",
      previousData: {
        title: milestone.title,
        displayOrder: milestone.displayOrder,
      },
      newData: parsed,
    });
  });
}

export async function reorderMilestones(
  actor: ProjectActor,
  input: ReorderMilestonesInput,
) {
  const parsed = reorderMilestonesInputSchema.parse(input);
  const project = await getProjectOrThrow(parsed.projectId);
  assertCanManageWorkItems(actor, project);

  const milestones = await getDb()
    .select()
    .from(schema.milestones)
    .where(inArray(schema.milestones.id, parsed.orderedMilestoneIds));

  if (
    milestones.length !== parsed.orderedMilestoneIds.length ||
    milestones.some((milestone) => milestone.projectId !== parsed.projectId)
  ) {
    throw new Error("Milestones must all belong to the same project.");
  }

  await inTransaction(async (tx) => {
    for (const [index, milestoneId] of parsed.orderedMilestoneIds.entries()) {
      await tx
        .update(schema.milestones)
        .set({ displayOrder: 10000 + index, updatedAt: new Date() })
        .where(eq(schema.milestones.id, milestoneId));
    }

    for (const [index, milestoneId] of parsed.orderedMilestoneIds.entries()) {
      await tx
        .update(schema.milestones)
        .set({ displayOrder: index + 1, updatedAt: new Date() })
        .where(eq(schema.milestones.id, milestoneId));
    }

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      resourceType: "milestone",
      resourceId: parsed.projectId,
      actionType: "milestone.reordered",
      eventType: "milestone.reordered.v1",
      newData: parsed.orderedMilestoneIds,
    });
  });
}

export async function deleteMilestone(
  actor: ProjectActor,
  input: DeleteMilestoneInput,
) {
  const parsed = deleteMilestoneInputSchema.parse(input);
  const milestone = await getMilestoneOrThrow(parsed.milestoneId);
  const project = await getProjectOrThrow(milestone.projectId);
  assertCanManageWorkItems(actor, project);

  const [taskCount] = await getDb()
    .select({ value: count() })
    .from(schema.tasks)
    .where(eq(schema.tasks.milestoneId, milestone.id));

  if ((taskCount?.value ?? 0) > 0) {
    throw new Error("Cannot delete a milestone that still has tasks.");
  }

  await inTransaction(async (tx) => {
    await tx.delete(schema.milestones).where(eq(schema.milestones.id, milestone.id));
    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: milestone.projectId,
      resourceType: "milestone",
      resourceId: milestone.id,
      actionType: "milestone.deleted",
      eventType: "milestone.deleted.v1",
      previousData: milestone,
    });
  });
}

export async function createTaskCategory(
  actor: ProjectActor,
  input: CreateCategoryInput,
) {
  const parsed = createCategoryInputSchema.parse(input);
  const project = await getProjectOrThrow(parsed.projectId);
  assertCanManageWorkItems(actor, project);
  const categoryId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx.insert(schema.taskCategories).values({
      id: categoryId,
      projectId: parsed.projectId,
      name: parsed.name,
      description: parsed.description,
    });

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: parsed.projectId,
      resourceType: "task_category",
      resourceId: categoryId,
      actionType: "task_category.created",
      eventType: "task_category.created.v1",
      newData: parsed,
    });
  });

  return categoryId;
}

export async function updateTaskCategory(
  actor: ProjectActor,
  input: UpdateCategoryInput,
) {
  const parsed = updateCategoryInputSchema.parse(input);
  const category = await getCategoryOrThrow(parsed.categoryId);
  const project = await getProjectOrThrow(category.projectId);
  assertCanManageWorkItems(actor, project);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.taskCategories)
      .set({
        name: parsed.name,
        description: parsed.description,
        updatedAt: new Date(),
      })
      .where(eq(schema.taskCategories.id, category.id));

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: category.projectId,
      resourceType: "task_category",
      resourceId: category.id,
      actionType: "task_category.updated",
      eventType: "task_category.updated.v1",
      previousData: {
        name: category.name,
        description: category.description,
      },
      newData: parsed,
    });
  });
}

export async function deleteTaskCategory(
  actor: ProjectActor,
  input: DeleteCategoryInput,
) {
  const parsed = deleteCategoryInputSchema.parse(input);
  const category = await getCategoryOrThrow(parsed.categoryId);
  const project = await getProjectOrThrow(category.projectId);
  assertCanManageWorkItems(actor, project);

  await inTransaction(async (tx) => {
    await tx
      .update(schema.tasks)
      .set({ categoryId: null, updatedAt: new Date() })
      .where(eq(schema.tasks.categoryId, category.id));
    await tx
      .delete(schema.taskCategories)
      .where(
        and(
          eq(schema.taskCategories.id, category.id),
          eq(schema.taskCategories.projectId, category.projectId),
        ),
      );

    await appendWorkItemEffects(tx, {
      actorId: actor.id,
      projectId: category.projectId,
      resourceType: "task_category",
      resourceId: category.id,
      actionType: "task_category.deleted",
      eventType: "task_category.deleted.v1",
      previousData: category,
    });
  });
}
