import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

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

    await expect(
      adapter.upload({
        buffer: Buffer.from("hello"),
        fileName: "hello.pdf",
        mimeType: "application/pdf",
        folder: "tests",
      }),
    ).rejects.toThrow(
      "Cloudinary storage credentials are incomplete.",
    );
  });

  it("uploads files to Cloudinary with signed form data", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          public_id: "tasks/task-1/generated-id",
          secure_url: "https://res.cloudinary.com/demo/image/upload/file.pdf",
          bytes: 5,
          resource_type: "image",
        }),
        { status: 200 },
      ),
    );
    const adapter = new CloudinaryStorageAdapter(
      {
        cloudName: "demo",
        apiKey: "key",
        apiSecret: "secret",
      },
      fetchImpl,
    );

    const uploaded = await adapter.upload({
      buffer: Buffer.from("hello"),
      fileName: "hello.pdf",
      mimeType: "application/pdf",
      folder: "tasks/task-1",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/demo/auto/upload",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchImpl.mock.calls[0]!;
    const formData = init?.body as FormData;
    expect(formData.get("api_key")).toBe("key");
    expect(formData.get("folder")).toBe("tasks/task-1");
    expect(formData.get("signature")).toEqual(expect.any(String));
    expect(uploaded.storageKey).toBe("image/tasks/task-1/generated-id");
    expect(uploaded.publicUrl).toBe(
      "https://res.cloudinary.com/demo/image/upload/file.pdf",
    );
    expect(uploaded.checksumSha256).toHaveLength(64);
  });

  it("deletes Cloudinary files by resource type and public id", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ result: "ok" }), { status: 200 }),
    );
    const adapter = new CloudinaryStorageAdapter(
      {
        cloudName: "demo",
        apiKey: "key",
        apiSecret: "secret",
      },
      fetchImpl,
    );

    await adapter.delete("raw/tasks/task-1/file-id");

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.cloudinary.com/v1_1/demo/raw/destroy",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchImpl.mock.calls[0]!;
    const formData = init?.body as FormData;
    expect(formData.get("public_id")).toBe("tasks/task-1/file-id");
    expect(formData.get("invalidate")).toBe("true");
  });
});
