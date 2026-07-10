import "@/src/infrastructure/server-only";

import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const serverEnvSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  STORAGE_PROVIDER: z.enum(["local", "cloudinary"]).default("local"),
  LOCAL_STORAGE_ROOT: z.string().default(".local/uploads"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const localDatabaseUrl =
  "mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev";

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

export function getDatabaseUrl(): string | undefined {
  const env = getServerEnv();
  const isNextProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  const isNpmBuild = process.env.npm_lifecycle_event === "build";

  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  if (env.NODE_ENV !== "production" || isNextProductionBuild || isNpmBuild) {
    return localDatabaseUrl;
  }

  return undefined;
}

export function requireDatabaseUrl(): string {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for database commands. Use the local MySQL value from .env.example.",
    );
  }

  return databaseUrl;
}
