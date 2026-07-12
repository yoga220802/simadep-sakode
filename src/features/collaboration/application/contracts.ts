import { z } from "zod";

import {
  allowedAttachmentMimeTypes,
  maxAttachmentSizeBytes,
} from "../domain/collaboration-policy";

export const createCommentInputSchema = z.object({
  taskId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
});

export const deleteCommentInputSchema = z.object({
  taskId: z.string().uuid(),
  commentId: z.string().uuid(),
});

export const createLinkAttachmentInputSchema = z.object({
  taskId: z.string().uuid(),
  commentId: z.string().uuid().optional(),
  link: z.string().url().max(1000),
  linkName: z.string().trim().min(1).max(255).optional(),
});

export const createFileAttachmentInputSchema = z.object({
  taskId: z.string().uuid(),
  commentId: z.string().uuid().optional(),
  fileName: z.string().trim().min(1).max(255).refine(
    (name) => !/[<>:"/\\|?*\u0000-\u001f]/.test(name),
    "File name contains invalid characters.",
  ),
  mimeType: z.enum(allowedAttachmentMimeTypes),
  sizeBytes: z.number().int().min(1).max(maxAttachmentSizeBytes),
  buffer: z.instanceof(Buffer),
});

export const deleteAttachmentInputSchema = z.object({
  attachmentId: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentInputSchema>;
export type CreateLinkAttachmentInput = z.infer<
  typeof createLinkAttachmentInputSchema
>;
export type CreateFileAttachmentInput = z.infer<
  typeof createFileAttachmentInputSchema
>;
export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentInputSchema>;

export type AttachmentItem = {
  id: string;
  taskId: string;
  commentId: string | null;
  uploadedBy: string | null;
  uploaderName: string | null;
  kind: "file" | "link";
  fileName: string;
  storageKey: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  checksumSha256: string | null;
  createdAt: Date;
};

export type CommentItem = {
  id: string;
  taskId: string;
  userId: string;
  authorName: string | null;
  content: string;
  createdAt: Date;
  attachments: AttachmentItem[];
};

export type TaskCollaboration = {
  taskId: string;
  comments: CommentItem[];
  taskAttachments: AttachmentItem[];
};
