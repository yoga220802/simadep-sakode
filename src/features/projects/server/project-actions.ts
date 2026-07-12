"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";

import {
  addProjectMember,
  archiveProject,
  createProject,
  getProjectActor,
  removeProjectMember,
  updateProject,
  updateProjectMember,
} from "../application/project-use-cases";
import type { ProjectActionResult } from "./action-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getActorFromSession() {
  const session = await requireServerSession();
  return getProjectActor(session.user.id);
}

async function runProjectAction(
  action: () => Promise<void>,
  successMessage: string,
): Promise<ProjectActionResult> {
  try {
    await action();
    revalidatePath("/projects");
    return { ok: true, message: successMessage };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Aksi project gagal.",
    };
  }
}

export async function createProjectAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  try {
    const projectId = await createProject(await getActorFromSession(), {
      departmentId: getString(formData, "departmentId"),
      title: getString(formData, "title"),
      description: getString(formData, "description") || undefined,
      status: getString(formData, "status") as never,
      startDate: getString(formData, "startDate") || undefined,
      endDate: getString(formData, "endDate") || undefined,
    });

    revalidatePath("/projects");
    return { ok: true, message: "Project berhasil dibuat.", projectId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal membuat project.",
    };
  }
}

export async function updateProjectAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  return runProjectAction(async () => {
    const projectId = getString(formData, "projectId");
    await updateProject(await getActorFromSession(), {
      projectId,
      version: Number(getString(formData, "version")),
      title: getString(formData, "title"),
      description: getString(formData, "description") || undefined,
      status: getString(formData, "status") as never,
      startDate: getString(formData, "startDate") || undefined,
      endDate: getString(formData, "endDate") || undefined,
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Project diperbarui.");
}

export async function archiveProjectAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  return runProjectAction(async () => {
    await archiveProject(await getActorFromSession(), {
      projectId: getString(formData, "projectId"),
    });
  }, "Project diarsipkan.");
}

export async function addProjectMemberAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  return runProjectAction(async () => {
    const projectId = getString(formData, "projectId");
    await addProjectMember(await getActorFromSession(), {
      projectId,
      userId: getString(formData, "userId"),
      role: getString(formData, "role") as never,
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Anggota project ditambahkan.");
}

export async function updateProjectMemberAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  return runProjectAction(async () => {
    const projectId = getString(formData, "projectId");
    await updateProjectMember(await getActorFromSession(), {
      projectId,
      memberId: getString(formData, "memberId"),
      role: getString(formData, "role") as never,
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Role anggota project diperbarui.");
}

export async function removeProjectMemberAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  return runProjectAction(async () => {
    const projectId = getString(formData, "projectId");
    await removeProjectMember(await getActorFromSession(), {
      projectId,
      memberId: getString(formData, "memberId"),
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Anggota project dihapus.");
}
