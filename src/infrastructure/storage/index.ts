import "@/src/infrastructure/server-only";

import { getServerEnv } from "@/src/infrastructure/env";

import { CloudinaryStorageAdapter } from "./adapters/cloudinary-storage";
import { LocalStorageAdapter } from "./adapters/local-storage";
import type { StorageAdapter } from "./port";

export const storageBoundary = "infrastructure.storage" as const;

let storageAdapter: StorageAdapter | undefined;

export function getStorageAdapter(): StorageAdapter {
  const env = getServerEnv();
  storageAdapter ??= shouldUseCloudinaryStorage(env)
    ? new CloudinaryStorageAdapter({
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
      })
    : createLocalStorageAdapter(env);

  return storageAdapter;
}

export function setStorageAdapterForTests(adapter: StorageAdapter | undefined) {
  storageAdapter = adapter;
}

export type { StorageAdapter, StorageUploadInput, StorageUploadResult } from "./port";

function shouldUseCloudinaryStorage(env: ReturnType<typeof getServerEnv>) {
  if (env.STORAGE_PROVIDER === "cloudinary") {
    return true;
  }

  return isServerlessProductionRuntime() && hasCloudinaryCredentials(env);
}

function createLocalStorageAdapter(env: ReturnType<typeof getServerEnv>) {
  if (isServerlessProductionRuntime()) {
    throw new Error(
      "Local file storage is not available on Vercel. Set STORAGE_PROVIDER=cloudinary and configure Cloudinary credentials.",
    );
  }

  return new LocalStorageAdapter(env.LOCAL_STORAGE_ROOT);
}

function isServerlessProductionRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function hasCloudinaryCredentials(env: ReturnType<typeof getServerEnv>) {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}
