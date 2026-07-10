import "@/src/infrastructure/server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const localDatabaseUrl = "mysql://simadep:simadep@127.0.0.1:3306/simadep";

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
