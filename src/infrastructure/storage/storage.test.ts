import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CloudinaryStorageAdapter } from "./adapters/cloudinary-storage";
import { LocalStorageAdapter } from "./adapters/local-storage";

describe("local storage adapter", () => {
  it("uploads and deletes files without external credentials", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "simadep-storage-"));
    const adapter = new LocalStorageAdapter(root);

    const uploaded = await adapter.upload({
      buffer: Buffer.from("hello"),
      fileName: "hello.pdf",
      mimeType: "application/pdf",
      folder: "tests",
    });

    await expect(readFile(path.join(root, uploaded.storageKey), "utf8")).resolves.toBe(
      "hello",
    );
    expect(uploaded.publicUrl).toContain("/uploads/tests/");
    expect(uploaded.checksumSha256).toHaveLength(64);

    await expect(adapter.delete(uploaded.storageKey)).resolves.toBeUndefined();
  });

  it("fails closed when Cloudinary credentials are incomplete", async () => {
    const adapter = new CloudinaryStorageAdapter({});

    await expect(adapter.upload()).rejects.toThrow(
      "Cloudinary storage credentials are incomplete.",
    );
  });
});
