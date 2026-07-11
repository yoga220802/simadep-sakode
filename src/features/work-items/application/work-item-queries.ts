import "@/src/infrastructure/server-only";

import { and, asc, desc, eq, isNull, like, or } from "drizzle-orm";

import { getDb, schema } from "@/src/infrastructure/db";
import type { ProjectActor } from "@/src/features/projects";
import { canManageWorkItems } from "../domain/work-item-policy";
import {
  myTaskListInputSchema,
  workItemListInputSchema,
  type MyTaskItem,
  type MyTaskListInput,
  type ProjectWorkItems,
  type WorkItemListInput,
  type WorkItemTask,
} from "./contracts";
import {
  buildTaskTree,
  ensureProjectVisible,
  filterTaskIdsByAssignee,
  getProjectMembersForDisplay,
  getProjectTaskStatuses,
  getTaskAssigneesForTasks,
} from "./work-item-internals";

function taskOrder(sortBy: string, descending: boolean) {
  const direction = descending ? desc : asc;
  switch (sortBy) {
    case "due_date":
      return direction(schema.tasks.dueDate);
    case "start_date":
      return direction(schema.tasks.startDate);
    case "title":
      return direction(schema.tasks.name);
    case "created_at":
      return direction(schema.tasks.createdAt);
    case "priority":
      return direction(schema.tasks.priority);
    case "status":
      return direction(schema.tasks.status);
    default:
      return direction(schema.tasks.displayOrder);
  }
}

export async function listProjectWorkItems(
  actor: ProjectActor,
  projectId: string,
  input: WorkItemListInput = {},
): Promise<ProjectWorkItems> {
  const filters = workItemListInputSchema.parse(input);
  const project = await ensureProjectVisible(actor, projectId);

  const [milestones, categories, statuses, projectMembers, taskRows] = await Promise.all([
    getDb()
      .select()
      .from(schema.milestones)
      .where(eq(schema.milestones.projectId, projectId))
      .orderBy(schema.milestones.displayOrder),
    getDb()
      .select({
        id: schema.taskCategories.id,
        name: schema.taskCategories.name,
        description: schema.taskCategories.description,
      })
      .from(schema.taskCategories)
      .where(eq(schema.taskCategories.projectId, projectId))
      .orderBy(schema.taskCategories.name),
    getProjectTaskStatuses(projectId),
    getProjectMembersForDisplay(projectId),
    getDb()
      .select({
        id: schema.tasks.id,
        projectId: schema.tasks.projectId,
        milestoneId: schema.tasks.milestoneId,
        parentId: schema.tasks.parentId,
        categoryId: schema.tasks.categoryId,
        categoryName: schema.taskCategories.name,
        name: schema.tasks.name,
        description: schema.tasks.description,
        status: schema.tasks.status,
        priority: schema.tasks.priority,
        displayOrder: schema.tasks.displayOrder,
        startDate: schema.tasks.startDate,
        dueDate: schema.tasks.dueDate,
        estimatedDurationMinutes: schema.tasks.estimatedDurationMinutes,
        finishedDurationMinutes: schema.tasks.finishedDurationMinutes,
        completedAt: schema.tasks.completedAt,
        version: schema.tasks.version,
      })
      .from(schema.tasks)
      .leftJoin(
        schema.taskCategories,
        eq(schema.taskCategories.id, schema.tasks.categoryId),
      )
      .where(
        and(
          eq(schema.tasks.projectId, projectId),
          filters.status ? eq(schema.tasks.status, filters.status) : undefined,
          filters.categoryId ? eq(schema.tasks.categoryId, filters.categoryId) : undefined,
          filters.search
            ? or(
                like(schema.tasks.name, `%${filters.search}%`),
                like(schema.tasks.description, `%${filters.search}%`),
              )
            : undefined,
        ),
      )
      .orderBy(taskOrder(filters.sortBy, filters.descending)),
  ]);

  const taskIds = taskRows.map((task) => task.id);
  const assigneeRows = await getTaskAssigneesForTasks(taskIds);
  const assignedFilterIds = filterTaskIdsByAssignee({
    assignedToMe: filters.assignedToMe,
    actorId: actor.id,
    assignees: assigneeRows,
  });

  const tasks: WorkItemTask[] = taskRows
    .filter((task) => !assignedFilterIds || assignedFilterIds.has(task.id))
    .map((task) => ({
      ...task,
      assignees: assigneeRows
        .filter((assignee) => assignee.taskId === task.id)
        .map((assignee) => ({
          id: assignee.id,
          userId: assignee.userId,
          name: assignee.name,
          email: assignee.email,
        })),
      subtasks: [],
    }));

  return {
    categories,
    statuses,
    projectMembers,
    canManage: canManageWorkItems(actor, project),
    milestones: milestones.map((milestone) => ({
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      displayOrder: milestone.displayOrder,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
      tasks: buildTaskTree(
        tasks.filter((task) => task.milestoneId === milestone.id),
      ),
    })),
  };
}

export async function listMyTasks(
  actor: ProjectActor,
  input: MyTaskListInput = {},
): Promise<MyTaskItem[]> {
  const filters = myTaskListInputSchema.parse(input);

  return getDb()
    .select({
      id: schema.tasks.id,
      projectId: schema.tasks.projectId,
      projectTitle: schema.projects.title,
      milestoneId: schema.tasks.milestoneId,
      milestoneTitle: schema.milestones.title,
      name: schema.tasks.name,
      status: schema.tasks.status,
      priority: schema.tasks.priority,
      dueDate: schema.tasks.dueDate,
      completedAt: schema.tasks.completedAt,
      finishedDurationMinutes: schema.tasks.finishedDurationMinutes,
      version: schema.tasks.version,
    })
    .from(schema.taskAssignees)
    .innerJoin(schema.tasks, eq(schema.tasks.id, schema.taskAssignees.taskId))
    .innerJoin(schema.projects, eq(schema.projects.id, schema.tasks.projectId))
    .innerJoin(schema.milestones, eq(schema.milestones.id, schema.tasks.milestoneId))
    .where(
      and(
        eq(schema.taskAssignees.userId, actor.id),
        isNull(schema.projects.deletedAt),
        filters.status ? eq(schema.tasks.status, filters.status) : undefined,
        filters.search
          ? or(
              like(schema.tasks.name, `%${filters.search}%`),
              like(schema.projects.title, `%${filters.search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(schema.tasks.dueDate), asc(schema.tasks.displayOrder));

}
