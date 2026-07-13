"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getProjectActor } from "@/src/features/projects";
import { getUserSafeErrorMessage } from "@/src/shared/errors";
import { processOutboxBestEffort } from "@/src/infrastructure/events";
import { publishRealtimeInvalidationBestEffort } from "@/src/infrastructure/realtime";

import {
  assignTask,
  changeTaskStatus,
  createMilestone,
  createSubtask,
  createTask,
  createTaskCategory,
  createTaskStatus,
  deleteMilestone,
  deleteTask,
  deleteTaskCategory,
  reorderMilestones,
  unassignTask,
  updateMilestone,
  updateTask,
  updateTaskCategory,
} from "../application";
import type { WorkItemActionResult } from "./action-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value || undefined;
}

async function getActorFromSession() {
  const session = await requireServerSession();
  return getProjectActor(session.user.id);
}

function revalidateProject(projectId?: string) {
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/tasks");
}

async function runWorkItemAction(
  action: () => Promise<Partial<WorkItemActionResult> | void>,
  successMessage: string,
  projectId?: string,
  realtime?: {
    type: string;
    taskId?: string;
    resourceId?: string;
    version?: number;
  },
): Promise<WorkItemActionResult> {
  try {
    const result = await action();
    revalidateProject(projectId);
    if (projectId && realtime) {
      const taskId = realtime.taskId ?? result?.taskId;
      await publishRealtimeInvalidationBestEffort({
        channels: [`private-project-${projectId}`],
        payload: {
          type: realtime.type,
          projectId,
          taskId,
          resourceId: realtime.resourceId ?? taskId,
          version: realtime.version,
        },
      });
    }
    await processOutboxBestEffort();
    return { ok: true, message: successMessage, ...result };
  } catch (error) {
    return {
      ok: false,
      message: getUserSafeErrorMessage(error, "Aksi work item gagal."),
    };
  }
}

export async function createMilestoneAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await createMilestone(await getActorFromSession(), {
      projectId,
      title: getString(formData, "title"),
    });
  }, "Milestone dibuat.", projectId, {
    type: "milestone.created.v1",
  });
}

export async function updateMilestoneAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await updateMilestone(await getActorFromSession(), {
      milestoneId: getString(formData, "milestoneId"),
      title: optionalString(formData, "title"),
      displayOrder: optionalString(formData, "displayOrder") as never,
    });
  }, "Milestone diperbarui.", projectId, {
    type: "milestone.updated.v1",
    resourceId: getString(formData, "milestoneId"),
  });
}

export async function reorderMilestonesAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await reorderMilestones(await getActorFromSession(), {
      projectId,
      orderedMilestoneIds: getString(formData, "orderedMilestoneIds")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    });
  }, "Urutan milestone diperbarui.", projectId, {
    type: "milestone.reordered.v1",
    resourceId: projectId,
  });
}

export async function deleteMilestoneAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await deleteMilestone(await getActorFromSession(), {
      milestoneId: getString(formData, "milestoneId"),
    });
  }, "Milestone dihapus.", projectId, {
    type: "milestone.deleted.v1",
    resourceId: getString(formData, "milestoneId"),
  });
}

export async function createCategoryAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await createTaskCategory(await getActorFromSession(), {
      projectId,
      name: getString(formData, "name"),
      description: optionalString(formData, "description"),
    });
  }, "Kategori dibuat.", projectId, {
    type: "task_category.created.v1",
  });
}

export async function createTaskStatusAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await createTaskStatus(await getActorFromSession(), {
      projectId,
      label: getString(formData, "label"),
    });
  }, "Status tugas dibuat.", projectId, {
    type: "task_status.created.v1",
  });
}

export async function updateCategoryAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await updateTaskCategory(await getActorFromSession(), {
      categoryId: getString(formData, "categoryId"),
      name: getString(formData, "name"),
      description: optionalString(formData, "description"),
    });
  }, "Kategori diperbarui.", projectId, {
    type: "task_category.updated.v1",
    resourceId: getString(formData, "categoryId"),
  });
}

export async function deleteCategoryAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await deleteTaskCategory(await getActorFromSession(), {
      categoryId: getString(formData, "categoryId"),
    });
  }, "Kategori dihapus.", projectId, {
    type: "task_category.deleted.v1",
    resourceId: getString(formData, "categoryId"),
  });
}

export async function createTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    const taskId = await createTask(await getActorFromSession(), {
      milestoneId: getString(formData, "milestoneId"),
      name: getString(formData, "name"),
      description: optionalString(formData, "description"),
      status: getString(formData, "status") as never,
      priority: optionalString(formData, "priority") as never,
      startDate: optionalString(formData, "startDate"),
      dueDate: optionalString(formData, "dueDate"),
      estimatedDurationMinutes: optionalString(
        formData,
        "estimatedDurationMinutes",
      ) as never,
      categoryId: optionalString(formData, "categoryId"),
    });
    return { taskId };
  }, "Tugas dibuat.", projectId, {
    type: "task.created.v1",
  });
}

export async function createSubtaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    const taskId = await createSubtask(await getActorFromSession(), {
      parentTaskId: getString(formData, "parentTaskId"),
      name: getString(formData, "name"),
      description: optionalString(formData, "description"),
      status: getString(formData, "status") as never,
      priority: optionalString(formData, "priority") as never,
      startDate: optionalString(formData, "startDate"),
      dueDate: optionalString(formData, "dueDate"),
      estimatedDurationMinutes: optionalString(
        formData,
        "estimatedDurationMinutes",
      ) as never,
      categoryId: optionalString(formData, "categoryId"),
    });
    return { taskId };
  }, "Subtask dibuat.", projectId, {
    type: "task.subtask_created.v1",
    taskId: getString(formData, "parentTaskId"),
  });
}

export async function updateTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    const result = await updateTask(await getActorFromSession(), {
      taskId: getString(formData, "taskId"),
      milestoneId: optionalString(formData, "milestoneId"),
      name: getString(formData, "name"),
      description: optionalString(formData, "description"),
      status: getString(formData, "status") as never,
      priority: optionalString(formData, "priority") as never,
      displayOrder: optionalString(formData, "displayOrder") as never,
      startDate: optionalString(formData, "startDate"),
      dueDate: optionalString(formData, "dueDate"),
      estimatedDurationMinutes: optionalString(
        formData,
        "estimatedDurationMinutes",
      ) as never,
      categoryId: optionalString(formData, "categoryId"),
      version: getString(formData, "version") as never,
    });
    return { taskId: result.taskId, taskVersion: result.version };
  }, "Tugas diperbarui.", projectId, {
    type: "task.updated.v1",
    taskId: getString(formData, "taskId"),
    version: Number(getString(formData, "version")) + 1,
  });
}

export async function deleteTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await deleteTask(await getActorFromSession(), {
      taskId: getString(formData, "taskId"),
    });
  }, "Tugas dihapus.", projectId, {
    type: "task.deleted.v1",
    taskId: getString(formData, "taskId"),
  });
}

export async function assignTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await assignTask(await getActorFromSession(), {
      taskId: getString(formData, "taskId"),
      userId: getString(formData, "userId"),
    });
  }, "Assignee ditambahkan.", projectId, {
    type: "task.assignee_added.v1",
    taskId: getString(formData, "taskId"),
  });
}

export async function unassignTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await unassignTask(await getActorFromSession(), {
      taskId: getString(formData, "taskId"),
      userId: getString(formData, "userId"),
    });
  }, "Assignee dilepas.", projectId, {
    type: "task.assignee_removed.v1",
    taskId: getString(formData, "taskId"),
  });
}

export async function changeTaskStatusAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  return runWorkItemAction(async () => {
    const result = await changeTaskStatus(await getActorFromSession(), {
      taskId: getString(formData, "taskId"),
      status: getString(formData, "status") as never,
      version: getString(formData, "version") as never,
    });
    return { taskId: result.taskId, taskVersion: result.version };
  }, "Status tugas diperbarui.", projectId, {
    type: "task.status_changed.v1",
    taskId: getString(formData, "taskId"),
    version: Number(getString(formData, "version")) + 1,
  });
}
