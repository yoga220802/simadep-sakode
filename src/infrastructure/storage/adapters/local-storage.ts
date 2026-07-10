import "@/src/infrastructure/server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  StorageAdapter,
  StorageUploadInput,
  StorageUploadResult,
} from "../port";

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly root: string) {}

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const checksumSha256 = createHash("sha256").update(input.buffer).digest("hex");
    const folder = input.folder.replace(/[^a-zA-Z0-9/_-]/g, "_");
    const key = `${folder}/${randomUUID()}-${safeFileName(input.fileName)}`;
    const absolutePath = path.resolve(this.root, key);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      storageKey: key,
      publicUrl: `/uploads/${key.replaceAll("\\", "/")}`,
      sizeBytes: input.buffer.byteLength,
      checksumSha256,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const target = path.resolve(this.root, storageKey);
    await rm(target, { force: true });
  }
}
