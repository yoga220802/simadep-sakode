"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getUserSafeErrorMessage } from "@/src/shared/errors";
import { processOutboxBestEffort } from "@/src/infrastructure/events";
import { publishRealtimeInvalidationBestEffort } from "@/src/infrastructure/realtime";

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
  action: () => Promise<Partial<ProjectActionResult> | void>,
  successMessage: string,
  realtime?: {
    projectId: string;
    type: string;
    resourceId?: string;
    version?: number;
  },
): Promise<ProjectActionResult> {
  try {
    const result = await action();
    revalidatePath("/projects");
    if (realtime) {
      await publishRealtimeInvalidationBestEffort({
        channels: [`private-project-${realtime.projectId}`],
        payload: {
          type: realtime.type,
          projectId: realtime.projectId,
          resourceId: realtime.resourceId ?? realtime.projectId,
          version: realtime.version,
        },
      });
    }
    await processOutboxBestEffort();
    return { ok: true, message: successMessage, ...result };
  } catch (error) {
    return {
      ok: false,
      message: getUserSafeErrorMessage(error, "Aksi project gagal."),
    };
  }
}

export async function createProjectAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  try {
    const departmentId = getString(formData, "departmentId");
    if (!departmentId) {
      return {
        ok: false,
        message: "Pilih departemen terlebih dahulu sebelum membuat project.",
      };
    }

    const projectId = await createProject(await getActorFromSession(), {
      departmentId,
      title: getString(formData, "title"),
      description: getString(formData, "description") || undefined,
      status: getString(formData, "status") as never,
      startDate: getString(formData, "startDate") || undefined,
      endDate: getString(formData, "endDate") || undefined,
    });

    revalidatePath("/projects");
    await publishRealtimeInvalidationBestEffort({
      channels: [`private-project-${projectId}`],
      payload: {
        type: "project.created.v1",
        projectId,
        resourceId: projectId,
      },
    });
    await processOutboxBestEffort();
    return { ok: true, message: "Project berhasil dibuat.", projectId };
  } catch (error) {
    return {
      ok: false,
      message: getUserSafeErrorMessage(error, "Gagal membuat project."),
    };
  }
}

export async function updateProjectAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const projectId = getString(formData, "projectId");
  return runProjectAction(async () => {
    const result = await updateProject(await getActorFromSession(), {
      projectId,
      version: Number(getString(formData, "version")),
      title: getString(formData, "title"),
      description: getString(formData, "description") || undefined,
      status: getString(formData, "status") as never,
      startDate: getString(formData, "startDate") || undefined,
      endDate: getString(formData, "endDate") || undefined,
    });
    revalidatePath(`/projects/${projectId}`);
    return { projectId: result.projectId, projectVersion: result.version };
  }, "Project diperbarui.", {
    projectId,
    type: "project.updated.v1",
    version: Number(getString(formData, "version")) + 1,
  });
}

export async function archiveProjectAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const projectId = getString(formData, "projectId");
  return runProjectAction(async () => {
    await archiveProject(await getActorFromSession(), {
      projectId,
    });
  }, "Project diarsipkan.", {
    projectId,
    type: "project.archived.v1",
  });
}

export async function addProjectMemberAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const projectId = getString(formData, "projectId");
  return runProjectAction(async () => {
    await addProjectMember(await getActorFromSession(), {
      projectId,
      userId: getString(formData, "userId"),
      role: getString(formData, "role") as never,
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Anggota project ditambahkan.", {
    projectId,
    type: "project.member_added.v1",
  });
}

export async function updateProjectMemberAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const projectId = getString(formData, "projectId");
  return runProjectAction(async () => {
    await updateProjectMember(await getActorFromSession(), {
      projectId,
      memberId: getString(formData, "memberId"),
      role: getString(formData, "role") as never,
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Role anggota project diperbarui.", {
    projectId,
    type: "project.member_role_changed.v1",
    resourceId: getString(formData, "memberId"),
  });
}

export async function removeProjectMemberAction(
  _previousState: ProjectActionResult,
  formData: FormData,
): Promise<ProjectActionResult> {
  const projectId = getString(formData, "projectId");
  return runProjectAction(async () => {
    await removeProjectMember(await getActorFromSession(), {
      projectId,
      memberId: getString(formData, "memberId"),
    });
    revalidatePath(`/projects/${projectId}`);
  }, "Anggota project dihapus.", {
    projectId,
    type: "project.member_removed.v1",
    resourceId: getString(formData, "memberId"),
  });
}
