import "@/src/infrastructure/server-only";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { getDb, inTransaction, schema } from "@/src/infrastructure/db";
import type { ProjectActor } from "@/src/features/projects";

import {
  assertCanCreateCollaboration,
  assertCanDeleteComment,
  assertCanViewCollaboration,
} from "../domain/collaboration-policy";
import {
  createCommentInputSchema,
  deleteCommentInputSchema,
  type AttachmentItem,
  type CreateCommentInput,
  type DeleteCommentInput,
  type TaskCollaboration,
} from "./contracts";
import {
  appendCollaborationEffects,
  getAttachmentsForTaskIds,
  getCommentOrThrow,
  getTaskIdsForProject,
  getTaskProjectOrThrow,
} from "./collaboration-internals";

export async function listTaskCollaboration(
  actor: ProjectActor,
  taskId: string,
): Promise<TaskCollaboration> {
  const { project } = await getTaskProjectOrThrow(taskId);
  assertCanViewCollaboration(actor, project);

  const [comments, attachments] = await Promise.all([
    getDb()
      .select({
        id: schema.comments.id,
        taskId: schema.comments.taskId,
        userId: schema.comments.userId,
        authorName: schema.user.name,
        content: schema.comments.content,
        createdAt: schema.comments.createdAt,
      })
      .from(schema.comments)
      .leftJoin(schema.user, eq(schema.user.id, schema.comments.userId))
      .where(and(eq(schema.comments.taskId, taskId), isNull(schema.comments.deletedAt)))
      .orderBy(asc(schema.comments.createdAt)),
    getAttachmentsForTaskIds([taskId]),
  ]);

  return buildTaskCollaboration(taskId, comments, attachments);
}

export async function listProjectTaskCollaboration(
  actor: ProjectActor,
  projectId: string,
) {
  const taskIds = await getTaskIdsForProject(projectId);
  if (taskIds.length === 0) {
    return {};
  }

  const { project } = await getTaskProjectOrThrow(taskIds[0]);
  assertCanViewCollaboration(actor, project);

  const [comments, attachments] = await Promise.all([
    getDb()
      .select({
        id: schema.comments.id,
        taskId: schema.comments.taskId,
        userId: schema.comments.userId,
        authorName: schema.user.name,
        content: schema.comments.content,
        createdAt: schema.comments.createdAt,
      })
      .from(schema.comments)
      .leftJoin(schema.user, eq(schema.user.id, schema.comments.userId))
      .where(
        and(inArray(schema.comments.taskId, taskIds), isNull(schema.comments.deletedAt)),
      )
      .orderBy(asc(schema.comments.createdAt)),
    getAttachmentsForTaskIds(taskIds),
  ]);

  return Object.fromEntries(
    taskIds.map((taskId) => [
      taskId,
      buildTaskCollaboration(taskId, comments, attachments),
    ]),
  );
}

function buildTaskCollaboration(
  taskId: string,
  comments: Array<{
    id: string;
    taskId: string;
    userId: string;
    authorName: string | null;
    content: string;
    createdAt: Date;
  }>,
  attachments: AttachmentItem[],
): TaskCollaboration {
  return {
    taskId,
    comments: comments
      .filter((comment) => comment.taskId === taskId)
      .map((comment) => ({
        ...comment,
        attachments: attachments.filter(
          (attachment) => attachment.commentId === comment.id,
        ),
      })),
    taskAttachments: attachments.filter(
      (attachment) => attachment.taskId === taskId && !attachment.commentId,
    ),
  };
}

export async function createComment(
  actor: ProjectActor,
  input: CreateCommentInput,
) {
  const parsed = createCommentInputSchema.parse(input);
  const { project } = await getTaskProjectOrThrow(parsed.taskId);
  assertCanCreateCollaboration(actor, project);
  const commentId = crypto.randomUUID();

  await inTransaction(async (tx) => {
    await tx.insert(schema.comments).values({
      id: commentId,
      taskId: parsed.taskId,
      userId: actor.id,
      content: parsed.content,
    });

    await appendCollaborationEffects(tx, {
      actorId: actor.id,
      projectId: project.id,
      taskId: parsed.taskId,
      resourceType: "comment",
      resourceId: commentId,
      actionType: "comment.created",
      eventType: "comment.created.v1",
      newData: { content: parsed.content },
    });
  });

  return commentId;
}

export async function deleteComment(
  actor: ProjectActor,
  input: DeleteCommentInput,
) {
  const parsed = deleteCommentInputSchema.parse(input);
  const comment = await getCommentOrThrow(parsed.commentId);
  if (comment.taskId !== parsed.taskId) {
    throw new Error("Comment does not belong to this task.");
  }

  const { project } = await getTaskProjectOrThrow(parsed.taskId);
  assertCanDeleteComment({ actor, project, authorId: comment.userId });

  await inTransaction(async (tx) => {
    await tx
      .update(schema.comments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.comments.id, parsed.commentId));

    await appendCollaborationEffects(tx, {
      actorId: actor.id,
      projectId: project.id,
      taskId: parsed.taskId,
      resourceType: "comment",
      resourceId: parsed.commentId,
      actionType: "comment.deleted",
      eventType: "comment.deleted.v1",
      previousData: { content: comment.content, userId: comment.userId },
    });
  });
}
