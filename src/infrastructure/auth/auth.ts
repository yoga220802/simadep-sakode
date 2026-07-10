import "@/src/infrastructure/server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";

import { getDb, schema } from "@/src/infrastructure/db";
import { getServerEnv } from "@/src/infrastructure/env";

const env = getServerEnv();

function getBetterAuthSecret() {
  if (env.BETTER_AUTH_SECRET) {
    return env.BETTER_AUTH_SECRET;
  }

  const isNextProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  const isNpmBuild = process.env.npm_lifecycle_event === "build";

  if (env.NODE_ENV === "production" && !isNextProductionBuild && !isNpmBuild) {
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  }

  return "simadep-local-development-secret-change-before-production";
}

export const auth = betterAuth({
  appName: "SIMADEP",
  baseURL: env.BETTER_AUTH_URL ?? env.APP_URL,
  secret: getBetterAuthSecret(),
  database: drizzleAdapter(getDb(), {
    provider: "mysql",
    schema,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["super_admin", "admin"],
      roles: {
        super_admin: adminAc,
        admin: adminAc,
        user: userAc,
      },
      defaultBanReason: "Akun dinonaktifkan oleh administrator SIMADEP.",
    }),
    nextCookies(),
  ],
});

export type BetterAuthSession = typeof auth.$Infer.Session;
