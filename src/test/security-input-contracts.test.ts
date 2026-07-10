import { describe, expect, it } from "vitest";

import { createFileAttachmentInputSchema } from "@/src/features/collaboration";
import { projectListInputSchema } from "@/src/features/projects";
import {
  deviceTokenInputSchema,
  listNotificationsInputSchema,
} from "@/src/features/notifications/application/contracts";

const taskId = "50000000-0000-4000-8000-000000000001";

describe("security-sensitive input contracts", () => {
  it("caps project pagination and trims bounded search input", () => {
    expect(projectListInputSchema.parse({ pageSize: 50 }).pageSize).toBe(50);
    expect(() => projectListInputSchema.parse({ pageSize: 51 })).toThrow();

    expect(projectListInputSchema.parse({ search: "  SIMADEP  " }).search).toBe(
      "SIMADEP",
    );
    expect(() =>
      projectListInputSchema.parse({ search: "x".repeat(121) }),
    ).toThrow();
  });

  it("caps notification inbox reads and device token shape", () => {
    expect(listNotificationsInputSchema.parse({ limit: 100 }).limit).toBe(100);
    expect(() => listNotificationsInputSchema.parse({ limit: 101 })).toThrow();

    expect(() =>
      deviceTokenInputSchema.parse({
        token: "x".repeat(20),
        deviceName: "browser",
      }),
    ).not.toThrow();
    expect(() =>
      deviceTokenInputSchema.parse({ token: "short-token" }),
    ).toThrow();
    expect(() =>
      deviceTokenInputSchema.parse({ token: "x".repeat(513) }),
    ).toThrow();
  });

  it("rejects unsafe upload metadata before storage is touched", () => {
    const valid = {
      taskId,
      fileName: "brief.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128,
      buffer: Buffer.from("ok"),
    };

    expect(() => createFileAttachmentInputSchema.parse(valid)).not.toThrow();
    expect(() =>
      createFileAttachmentInputSchema.parse({
        ...valid,
        fileName: "../secret.pdf",
      }),
    ).toThrow("File name contains invalid characters.");
    expect(() =>
      createFileAttachmentInputSchema.parse({
        ...valid,
        mimeType: "application/x-msdownload",
      }),
    ).toThrow();
    expect(() =>
      createFileAttachmentInputSchema.parse({
        ...valid,
        sizeBytes: 10 * 1024 * 1024 + 1,
      }),
    ).toThrow();
  });
});
