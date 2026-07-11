import "@/src/infrastructure/server-only";

import { createHash } from "node:crypto";

import type {
  StorageAdapter,
  StorageUploadInput,
  StorageUploadResult,
} from "../port";

export type CloudinaryStorageConfig = {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
};

export class CloudinaryStorageAdapter implements StorageAdapter {
  constructor(
    private readonly config: CloudinaryStorageConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const config = this.getConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = crypto.randomUUID();
    const signedParams = {
      folder: input.folder,
      public_id: publicId,
      timestamp,
    };
    const formData = new FormData();
    formData.set(
      "file",
      new Blob([new Uint8Array(input.buffer)], { type: input.mimeType }),
      input.fileName,
    );
    formData.set("api_key", config.apiKey);
    formData.set("folder", signedParams.folder);
    formData.set("public_id", signedParams.public_id);
    formData.set("timestamp", signedParams.timestamp);
    formData.set("signature", signCloudinaryParams(signedParams, config.apiSecret));

    const response = await this.fetchImpl(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;

    if (!response.ok || !data?.public_id || !data.secure_url) {
      throw new Error(
        `Cloudinary upload failed with status ${response.status}: ${getCloudinaryError(data)}`,
      );
    }

    return {
      storageKey: `${data.resource_type ?? "image"}/${data.public_id}`,
      publicUrl: data.secure_url,
      sizeBytes: Number(data.bytes ?? input.buffer.byteLength),
      checksumSha256: createHash("sha256").update(input.buffer).digest("hex"),
    };
  }

  async delete(storageKey: string): Promise<void> {
    const config = this.getConfig();
    const { resourceType, publicId } = parseStorageKey(storageKey);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParams = {
      invalidate: "true",
      public_id: publicId,
      timestamp,
    };
    const formData = new FormData();
    formData.set("api_key", config.apiKey);
    formData.set("invalidate", signedParams.invalidate);
    formData.set("public_id", signedParams.public_id);
    formData.set("timestamp", signedParams.timestamp);
    formData.set("signature", signCloudinaryParams(signedParams, config.apiSecret));

    const response = await this.fetchImpl(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = (await response.json().catch(() => null)) as CloudinaryDeleteResponse | null;

    if (!response.ok || (data?.result !== "ok" && data?.result !== "not found")) {
      throw new Error(
        `Cloudinary delete failed with status ${response.status}: ${getCloudinaryError(data)}`,
      );
    }
  }

  private getConfig(): Required<CloudinaryStorageConfig> {
    if (
      !this.config.cloudName ||
      !this.config.apiKey ||
      !this.config.apiSecret
    ) {
      throw new Error("Cloudinary storage credentials are incomplete.");
    }

    return {
      cloudName: this.config.cloudName,
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
    };
  }
}

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  bytes?: number;
  resource_type?: string;
  error?: { message?: string };
};

type CloudinaryDeleteResponse = {
  result?: string;
  error?: { message?: string };
};

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function parseStorageKey(storageKey: string) {
  const separatorIndex = storageKey.indexOf("/");
  if (separatorIndex <= 0 || separatorIndex === storageKey.length - 1) {
    throw new Error("Invalid Cloudinary storage key.");
  }

  return {
    resourceType: storageKey.slice(0, separatorIndex),
    publicId: storageKey.slice(separatorIndex + 1),
  };
}

function getCloudinaryError(
  data: CloudinaryUploadResponse | CloudinaryDeleteResponse | null,
) {
  return data?.error?.message ?? "unknown provider error";
}
