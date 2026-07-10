import "@/src/infrastructure/server-only";

export type StorageUploadInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder: string;
};

export type StorageUploadResult = {
  storageKey: string;
  publicUrl: string;
  sizeBytes: number;
  checksumSha256?: string;
};

export type StorageAdapter = {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(storageKey: string): Promise<void>;
};
