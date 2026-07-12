import { describe, expect, it } from "vitest";

import type { ProjectActor } from "@/src/features/projects";
import {
  assertCanDeleteAttachment,
  assertCanDeleteComment,
  createFileAttachmentInputSchema,
  createLinkAttachmentInputSchema,
} from "../index";

const project = { id: "project-1", departmentId: "department-1" };

const contributor: ProjectActor = {
  id: "user-1",
  globalRole: "user",
  departmentMemberships: [],
  projectMemberships: [{ projectId: "project-1", role: "contributor" }],
};

const owner: ProjectActor = {
  ...contributor,
  id: "owner-1",
  projectMemberships: [{ projectId: "project-1", role: "owner" }],
};

describe("collaboration policy", () => {
  it("allows comment authors to delete their own comments", () => {
    expect(() =>
      assertCanDeleteComment({
        actor: contributor,
        project,
        authorId: "user-1",
      }),
    ).not.toThrow();
  });

  it("allows privileged project actors to delete comments", () => {
    expect(() =>
      assertCanDeleteComment({
        actor: owner,
        project,
        authorId: "user-2",
      }),
    ).not.toThrow();
  });

  it("denies non-author contributors from deleting comments", () => {
    expect(() =>
      assertCanDeleteComment({
        actor: contributor,
        project,
        authorId: "user-2",
      }),
    ).toThrow("Only the comment author");
  });

  it("allows uploaders to delete their attachments", () => {
    expect(() =>
      assertCanDeleteAttachment({
        actor: contributor,
        project,
        uploadedBy: "user-1",
      }),
    ).not.toThrow();
  });

  it("validates allowed file metadata", () => {
    expect(() =>
      createFileAttachmentInputSchema.parse({
        taskId: "50000000-0000-4000-8000-000000000001",
        fileName: "brief.pdf",
        mimeType: "application/pdf",
        sizeBytes: 128,
        buffer: Buffer.from("ok"),
      }),
    ).not.toThrow();
  });

  it("rejects invalid URLs for link attachments", () => {
    expect(() =>
      createLinkAttachmentInputSchema.parse({
        taskId: "50000000-0000-4000-8000-000000000001",
        link: "not-a-url",
      }),
    ).toThrow();
  });
});
