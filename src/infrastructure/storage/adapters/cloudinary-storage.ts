import "@/src/infrastructure/server-only";

import type {
  StorageAdapter,
  StorageUploadResult,
} from "../port";

export type CloudinaryStorageConfig = {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
};

export class CloudinaryStorageAdapter implements StorageAdapter {
  constructor(private readonly config: CloudinaryStorageConfig) {}

  async upload(): Promise<StorageUploadResult> {
    this.assertConfigured();
    throw new Error(
      "Cloudinary storage adapter is configured but SDK upload is not implemented yet.",
    );
  }

  async delete(): Promise<void> {
    this.assertConfigured();
    throw new Error(
      "Cloudinary storage adapter is configured but SDK delete is not implemented yet.",
    );
  }

  private assertConfigured() {
    if (
      !this.config.cloudName ||
      !this.config.apiKey ||
      !this.config.apiSecret
    ) {
      throw new Error("Cloudinary storage credentials are incomplete.");
    }
  }
}
