import { migrate } from "drizzle-orm/mysql2/migrator";

import { closeDb, getDb } from "@/src/infrastructure/db";

async function main() {
  await migrate(getDb(), {
    migrationsFolder: "src/infrastructure/db/migrations",
  });
}

main()
  .then(async () => {
    await closeDb();
    console.log("Database migrations applied.");
  })
  .catch(async (error: unknown) => {
    await closeDb();
    console.error(error);
    process.exitCode = 1;
  });
