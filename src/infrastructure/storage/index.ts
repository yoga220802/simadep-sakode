import "@/src/infrastructure/server-only";

import { getServerEnv } from "@/src/infrastructure/env";

import { CloudinaryStorageAdapter } from "./adapters/cloudinary-storage";
import { LocalStorageAdapter } from "./adapters/local-storage";
import type { StorageAdapter } from "./port";

export const storageBoundary = "infrastructure.storage" as const;

let storageAdapter: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  const env = getServerEnv();
  storageAdapter ??=
    env.STORAGE_PROVIDER === "cloudinary"
      ? new CloudinaryStorageAdapter({
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          apiSecret: env.CLOUDINARY_API_SECRET,
        })
      : new LocalStorageAdapter(env.LOCAL_STORAGE_ROOT);

  return storageAdapter;
}

export function setStorageAdapterForTests(adapter: StorageAdapter | undefined) {
  storageAdapter = adapter;
}

export type { StorageAdapter, StorageUploadInput, StorageUploadResult } from "./port";
