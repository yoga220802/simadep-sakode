import "@/src/infrastructure/server-only";

import { getStorageAdapter } from "@/src/infrastructure/storage";
import type { ProjectActor } from "@/src/features/projects";

import {
  assertCanCreateCollaboration,
  assertCanDeleteAttachment,
} from "../domain/collaboration-policy";
import {
  createFileAttachmentInputSchema,
  createLinkAttachmentInputSchema,
  deleteAttachmentInputSchema,
  type CreateFileAttachmentInput,
  type CreateLinkAttachmentInput,
  type DeleteAttachmentInput,
} from "./contracts";
import {
  appendCollaborationEffects,
  cleanupUploadedObject,
  deleteAttachmentRowWithEffects,
  getAttachmentOrThrow,
  getCommentOrThrow,
  getTaskProjectOrThrow,
} from "./collaboration-internals";
import { inTransaction, schema } from "@/src/infrastructure/db";

export async function createLinkAttachment(
  actor: ProjectActor,
  input: CreateLinkAttachmentInput,
) {
  const parsed = createLinkAttachmentInputSchema.parse(input);
  const { project } = await getTaskProjectOrThrow(parsed.taskId);
  assertCanCreateCollaboration(actor, project);

  if (parsed.commentId) {
    const comment = await getCommentOrThrow(parsed.commentId);
    if (comment.taskId !== parsed.taskId) {
      throw new Error("Comment does not belong to this task.");
    }
  }

  const attachmentId = crypto.randomUUID();
  await inTransaction(async (tx) => {
    await tx.insert(schema.attachments).values({
      id: attachmentId,
      taskId: parsed.taskId,
      commentId: parsed.commentId,
      uploadedBy: actor.id,
      kind: "link",
      fileName: parsed.linkName ?? parsed.link,
      externalUrl: parsed.link,
      mimeType: "text/uri-list",
      sizeBytes: 0,
    });

    await appendCollaborationEffects(tx, {
      actorId: actor.id,
      projectId: project.id,
      taskId: parsed.taskId,
      resourceType: "attachment",
      resourceId: attachmentId,
      actionType: "attachment.link_added",
      eventType: "attachment.added.v1",
      newData: parsed,
    });
  });

  return attachmentId;
}

export async function createFileAttachment(
  actor: ProjectActor,
  input: CreateFileAttachmentInput,
) {
  const parsed = createFileAttachmentInputSchema.parse(input);
  const { project } = await getTaskProjectOrThrow(parsed.taskId);
  assertCanCreateCollaboration(actor, project);

  if (parsed.commentId) {
    const comment = await getCommentOrThrow(parsed.commentId);
    if (comment.taskId !== parsed.taskId) {
      throw new Error("Comment does not belong to this task.");
    }
  }

  const upload = await getStorageAdapter().upload({
    buffer: parsed.buffer,
    fileName: parsed.fileName,
    mimeType: parsed.mimeType,
    folder: `tasks/${parsed.taskId}`,
  });
  const attachmentId = crypto.randomUUID();

  try {
    await inTransaction(async (tx) => {
      await tx.insert(schema.attachments).values({
        id: attachmentId,
        taskId: parsed.taskId,
        commentId: parsed.commentId,
        uploadedBy: actor.id,
        kind: "file",
        fileName: parsed.fileName,
        storageKey: upload.storageKey,
        externalUrl: upload.publicUrl,
        mimeType: parsed.mimeType,
        sizeBytes: upload.sizeBytes,
        checksumSha256: upload.checksumSha256,
      });

      await appendCollaborationEffects(tx, {
        actorId: actor.id,
        projectId: project.id,
        taskId: parsed.taskId,
        resourceType: "attachment",
        resourceId: attachmentId,
        actionType: "attachment.file_added",
        eventType: "attachment.added.v1",
        newData: {
          fileName: parsed.fileName,
          mimeType: parsed.mimeType,
          sizeBytes: upload.sizeBytes,
        },
      });
    });
  } catch (error) {
    await cleanupUploadedObject({
      actorId: actor.id,
      attachmentId,
      taskId: parsed.taskId,
      projectId: project.id,
      storageKey: upload.storageKey,
      reason: "db_insert_failed",
    });
    throw error;
  }

  return attachmentId;
}

export async function deleteAttachment(
  actor: ProjectActor,
  input: DeleteAttachmentInput,
) {
  const parsed = deleteAttachmentInputSchema.parse(input);
  const attachment = await getAttachmentOrThrow(parsed.attachmentId);
  const { project } = await getTaskProjectOrThrow(attachment.taskId);
  assertCanDeleteAttachment({
    actor,
    project,
    uploadedBy: attachment.uploadedBy,
  });

  await deleteAttachmentRowWithEffects({
    actorId: actor.id,
    attachmentId: attachment.id,
    taskId: attachment.taskId,
    projectId: project.id,
    attachment,
  });

  if (attachment.kind === "file") {
    await cleanupUploadedObject({
      actorId: actor.id,
      attachmentId: attachment.id,
      taskId: attachment.taskId,
      projectId: project.id,
      storageKey: attachment.storageKey,
      reason: "delete_attachment",
    });
  }
}
