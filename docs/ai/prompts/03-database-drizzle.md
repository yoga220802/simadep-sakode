# Prompt 03 — MySQL and Drizzle Foundation

Implement database foundation without requiring a remote database.

Tasks:

1. Install Drizzle ORM, Drizzle Kit, mysql2, Zod env validation, tsx, and test dependencies approved by docs.
2. Implement schema from `docs/ai/05-database-schema-and-drizzle.md` excluding Better Auth tables that should be generated/integrated correctly.
3. Add relations, DB connection, transaction abstraction, UUID helper, and server-only guards.
4. Add `drizzle.config.ts`.
5. Add db scripts: generate, check, migrate, seed.
6. Generate initial migration but do not apply to remote DB.
7. Add deterministic seed design including bootstrap admin placeholder, departments, projects, tasks.
8. Add docker-compose local MySQL and GitHub Actions integration template if absent.
9. Add schema compilation tests.
10. Run lint/typecheck/unit/build/db:generate. If no MySQL, clearly skip migrate/integration.

Do not implement UI feature migrations yet.
