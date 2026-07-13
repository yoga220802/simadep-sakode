"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getProjectActor } from "@/src/features/projects";
import { processOutboxBestEffort } from "@/src/infrastructure/events";
import { publishRealtimeInvalidationBestEffort } from "@/src/infrastructure/realtime";
import {
  maxUploadFileSizeBytes,
  maxUploadFileSizeLabel,
} from "@/src/shared/upload-limits";
import { getUserSafeErrorMessage } from "@/src/shared/errors";

import {
  createComment,
  deleteComment,
} from "../application/collaboration-use-cases";
import {
  createFileAttachment,
  createLinkAttachment,
  deleteAttachment,
} from "../application/attachment-use-cases";
import type { CollaborationActionResult } from "./action-state";

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

function revalidateCollaboration(projectId?: string) {
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/tasks");
}

async function runCollaborationAction(
  action: () => Promise<void>,
  successMessage: string,
  projectId?: string,
  realtime?: {
    type: string;
    taskId?: string;
    resourceId?: string;
  },
): Promise<CollaborationActionResult> {
  try {
    await action();
    revalidateCollaboration(projectId);
    if (projectId && realtime) {
      await publishRealtimeInvalidationBestEffort({
        channels: [`private-project-${projectId}`],
        payload: {
          type: realtime.type,
          projectId,
          taskId: realtime.taskId,
          resourceId: realtime.resourceId,
        },
      });
    }
    await processOutboxBestEffort(100);
    return { ok: true, message: successMessage };
  } catch (error) {
    return {
      ok: false,
      message: getUserSafeErrorMessage(error, "Aksi kolaborasi gagal."),
    };
  }
}

export async function createCommentAction(
  _previousState: CollaborationActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  const taskId = getString(formData, "taskId");
  return runCollaborationAction(async () => {
    await createComment(await getActorFromSession(), {
      taskId,
      content: getString(formData, "content"),
    });
  }, "Komentar ditambahkan.", projectId, {
    type: "comment.created.v1",
    taskId,
  });
}

export async function deleteCommentAction(
  _previousState: CollaborationActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  const taskId = getString(formData, "taskId");
  const commentId = getString(formData, "commentId");
  return runCollaborationAction(async () => {
    await deleteComment(await getActorFromSession(), {
      taskId,
      commentId,
    });
  }, "Komentar dihapus.", projectId, {
    type: "comment.deleted.v1",
    taskId,
    resourceId: commentId,
  });
}

export async function createLinkAttachmentAction(
  _previousState: CollaborationActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  const taskId = getString(formData, "taskId");
  return runCollaborationAction(async () => {
    await createLinkAttachment(await getActorFromSession(), {
      taskId,
      commentId: optionalString(formData, "commentId"),
      link: getString(formData, "link"),
      linkName: optionalString(formData, "linkName"),
    });
  }, "Tautan ditambahkan.", projectId, {
    type: "attachment.added.v1",
    taskId,
  });
}

export async function createFileAttachmentAction(
  _previousState: CollaborationActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  const taskId = getString(formData, "taskId");
  return runCollaborationAction(async () => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("File is required.");
    }
    if (file.size > maxUploadFileSizeBytes) {
      throw new Error(`File maksimal ${maxUploadFileSizeLabel}.`);
    }

    await createFileAttachment(await getActorFromSession(), {
      taskId,
      commentId: optionalString(formData, "commentId"),
      fileName: file.name,
      mimeType: file.type as never,
      sizeBytes: file.size,
      buffer: Buffer.from(await file.arrayBuffer()),
    });
  }, "File ditambahkan.", projectId, {
    type: "attachment.added.v1",
    taskId,
  });
}

export async function deleteAttachmentAction(
  _previousState: CollaborationActionResult,
  formData: FormData,
) {
  const projectId = optionalString(formData, "projectId");
  const taskId = optionalString(formData, "taskId");
  const attachmentId = getString(formData, "attachmentId");
  return runCollaborationAction(async () => {
    await deleteAttachment(await getActorFromSession(), {
      attachmentId,
    });
  }, "Lampiran dihapus.", projectId, {
    type: "attachment.deleted.v1",
    taskId,
    resourceId: attachmentId,
  });
}
