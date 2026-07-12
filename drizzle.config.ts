import { defineConfig } from "drizzle-kit";

const localDatabaseUrl =
  "mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev";

export default defineConfig({
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./src/infrastructure/db/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
  strict: true,
  verbose: true,
});
