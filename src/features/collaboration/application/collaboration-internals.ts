import "@/src/infrastructure/server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";

import {
  getDb,
  inTransaction,
  schema,
  type DatabaseTransaction,
} from "@/src/infrastructure/db";
import { getStorageAdapter } from "@/src/infrastructure/storage";

export async function getTaskProjectOrThrow(taskId: string) {
  const [row] = await getDb()
    .select({
      task: schema.tasks,
      project: schema.projects,
    })
    .from(schema.tasks)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.tasks.projectId))
    .where(and(eq(schema.tasks.id, taskId), isNull(schema.projects.deletedAt)))
    .limit(1);

  if (!row) {
    throw new Error("Task not found.");
  }

  return row;
}

export async function getCommentOrThrow(commentId: string) {
  const [comment] = await getDb()
    .select()
    .from(schema.comments)
    .where(and(eq(schema.comments.id, commentId), isNull(schema.comments.deletedAt)))
    .limit(1);

  if (!comment) {
    throw new Error("Comment not found.");
  }

  return comment;
}

export async function getAttachmentOrThrow(attachmentId: string) {
  const [attachment] = await getDb()
    .select()
    .from(schema.attachments)
    .where(eq(schema.attachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    throw new Error("Attachment not found.");
  }

  return attachment;
}

export async function appendCollaborationEffects(
  tx: DatabaseTransaction,
  input: {
    actorId: string;
    projectId: string;
    taskId: string;
    resourceType: "comment" | "attachment";
    resourceId: string;
    actionType: string;
    eventType: string;
    previousData?: unknown;
    newData?: unknown;
  },
) {
  const notification = getCollaborationNotification(input.eventType);

  await tx.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    performedBy: input.actorId,
    projectId: input.projectId,
    taskId: input.taskId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    actionType: input.actionType,
    previousData: input.previousData,
    newData: input.newData,
  });

  await tx.insert(schema.outboxEvents).values({
    id: crypto.randomUUID(),
    eventType: input.eventType,
    aggregateType: input.resourceType,
    aggregateId: input.resourceId,
    payload: {
      actorId: input.actorId,
      projectId: input.projectId,
      taskId: input.taskId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      actionType: input.actionType,
      previousData: input.previousData,
      newData: input.newData,
    },
  });

  const recipientRows = await tx
    .select({ userId: schema.projectMembers.userId })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, input.projectId));

  const recipients = [...new Set(recipientRows.map((row) => row.userId))].filter(
    (recipientId) => recipientId !== input.actorId,
  );

  if (recipients.length > 0) {
    await tx.insert(schema.notifications).values(
      recipients.map((recipientId) => ({
        id: crypto.randomUUID(),
        recipientId,
        actorId: input.actorId,
        type: input.eventType,
        title: notification.title,
        message: notification.message,
        projectId: input.projectId,
        taskId: input.taskId,
        data: {
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          actionType: input.actionType,
        },
      })),
    );
  }
}

function getCollaborationNotification(eventType: string) {
  switch (eventType) {
    case "comment.created.v1":
      return {
        title: "Komentar tugas baru",
        message: "Ada komentar baru di tugas project.",
      };
    case "comment.deleted.v1":
      return {
        title: "Komentar tugas dihapus",
        message: "Diskusi tugas diperbarui.",
      };
    case "attachment.added.v1":
      return {
        title: "Lampiran tugas baru",
        message: "Ada lampiran baru di tugas project.",
      };
    case "attachment.deleted.v1":
      return {
        title: "Lampiran tugas dihapus",
        message: "Lampiran tugas diperbarui.",
      };
    default:
      return {
        title: "Diskusi tugas diperbarui",
        message: "Ada pembaruan pada diskusi tugas project.",
      };
  }
}

export async function enqueueStorageCleanup(input: {
  actorId: string;
  attachmentId: string;
  taskId: string;
  projectId: string;
  storageKey: string;
  reason: string;
}) {
  await getDb().insert(schema.outboxEvents).values({
    id: crypto.randomUUID(),
    eventType: "attachment.storage_cleanup_requested.v1",
    aggregateType: "attachment",
    aggregateId: input.attachmentId,
    payload: input,
  });
}

export async function cleanupUploadedObject(input: {
  actorId: string;
  attachmentId: string;
  taskId: string;
  projectId: string;
  storageKey: string | null;
  reason: string;
}) {
  if (!input.storageKey) {
    return;
  }

  try {
    await getStorageAdapter().delete(input.storageKey);
  } catch {
    await enqueueStorageCleanup({
      actorId: input.actorId,
      attachmentId: input.attachmentId,
      taskId: input.taskId,
      projectId: input.projectId,
      storageKey: input.storageKey,
      reason: input.reason,
    });
  }
}

export async function deleteAttachmentRowWithEffects(input: {
  actorId: string;
  attachmentId: string;
  taskId: string;
  projectId: string;
  attachment: unknown;
}) {
  await inTransaction(async (tx) => {
    await tx
      .delete(schema.attachments)
      .where(eq(schema.attachments.id, input.attachmentId));
    await appendCollaborationEffects(tx, {
      actorId: input.actorId,
      projectId: input.projectId,
      taskId: input.taskId,
      resourceType: "attachment",
      resourceId: input.attachmentId,
      actionType: "attachment.deleted",
      eventType: "attachment.deleted.v1",
      previousData: input.attachment,
    });
  });
}

export async function getTaskIdsForProject(projectId: string) {
  const rows = await getDb()
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(eq(schema.tasks.projectId, projectId));
  return rows.map((row) => row.id);
}

export async function getAttachmentsForTaskIds(taskIds: string[]) {
  if (taskIds.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: schema.attachments.id,
      taskId: schema.attachments.taskId,
      commentId: schema.attachments.commentId,
      uploadedBy: schema.attachments.uploadedBy,
      uploaderName: schema.user.name,
      kind: schema.attachments.kind,
      fileName: schema.attachments.fileName,
      storageKey: schema.attachments.storageKey,
      externalUrl: schema.attachments.externalUrl,
      mimeType: schema.attachments.mimeType,
      sizeBytes: schema.attachments.sizeBytes,
      checksumSha256: schema.attachments.checksumSha256,
      createdAt: schema.attachments.createdAt,
    })
    .from(schema.attachments)
    .leftJoin(schema.user, eq(schema.user.id, schema.attachments.uploadedBy))
    .where(inArray(schema.attachments.taskId, taskIds));
}
