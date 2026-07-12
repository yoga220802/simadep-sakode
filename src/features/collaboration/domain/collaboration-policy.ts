import type { ProjectActor } from "@/src/features/projects";
import { canManageProject, canViewProject } from "@/src/features/projects";
import { maxUploadFileSizeBytes } from "@/src/shared/upload-limits";

type ProjectRef = {
  id: string;
  departmentId: string;
};

export const allowedAttachmentMimeTypes = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const maxAttachmentSizeBytes = maxUploadFileSizeBytes;

export function assertCanViewCollaboration(
  actor: ProjectActor,
  project: ProjectRef,
) {
  if (!canViewProject(actor, project)) {
    throw new Error("You do not have access to this task collaboration.");
  }
}

export function assertCanCreateCollaboration(
  actor: ProjectActor,
  project: ProjectRef,
) {
  assertCanViewCollaboration(actor, project);
}

export function canModerateCollaboration(actor: ProjectActor, project: ProjectRef) {
  return canManageProject(actor, project);
}

export function assertCanDeleteComment(input: {
  actor: ProjectActor;
  project: ProjectRef;
  authorId: string;
}) {
  if (
    input.actor.id !== input.authorId &&
    !canModerateCollaboration(input.actor, input.project)
  ) {
    throw new Error("Only the comment author or a privileged project actor can delete it.");
  }
}

export function assertCanDeleteAttachment(input: {
  actor: ProjectActor;
  project: ProjectRef;
  uploadedBy: string | null;
}) {
  if (
    input.uploadedBy !== input.actor.id &&
    !canModerateCollaboration(input.actor, input.project)
  ) {
    throw new Error(
      "Only the attachment uploader or a privileged project actor can delete it.",
    );
  }
}
