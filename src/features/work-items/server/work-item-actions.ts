"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getProjectActor } from "@/src/features/projects";

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
  action: () => Promise<void>,
  successMessage: string,
  projectId?: string,
): Promise<WorkItemActionResult> {
  try {
    await action();
    revalidateProject(projectId);
    return { ok: true, message: successMessage };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Aksi work item gagal.",
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
  }, "Milestone dibuat.", projectId);
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
  }, "Milestone diperbarui.", projectId);
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
  }, "Urutan milestone diperbarui.", projectId);
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
  }, "Milestone dihapus.", projectId);
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
  }, "Kategori dibuat.", projectId);
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
  }, "Status tugas dibuat.", projectId);
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
  }, "Kategori diperbarui.", projectId);
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
  }, "Kategori dihapus.", projectId);
}

export async function createTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await createTask(await getActorFromSession(), {
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
  }, "Tugas dibuat.", projectId);
}

export async function createSubtaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await createSubtask(await getActorFromSession(), {
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
  }, "Subtask dibuat.", projectId);
}

export async function updateTaskAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = getString(formData, "projectId");
  return runWorkItemAction(async () => {
    await updateTask(await getActorFromSession(), {
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
  }, "Tugas diperbarui.", projectId);
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
  }, "Tugas dihapus.", projectId);
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
  }, "Assignee ditambahkan.", projectId);
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
  }, "Assignee dilepas.", projectId);
}

export async function changeTaskStatusAction(
  _previousState: WorkItemActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  return runWorkItemAction(async () => {
    await changeTaskStatus(await getActorFromSession(), {
      taskId: getString(formData, "taskId"),
      status: getString(formData, "status") as never,
      version: getString(formData, "version") as never,
    });
  }, "Status tugas diperbarui.", projectId);
}
