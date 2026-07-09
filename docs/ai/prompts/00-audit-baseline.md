# Prompt 00 — Audit and Baseline

Read `AGENTS.md`, `CODEX_START_HERE.md`, and all `docs/ai/*`. Do not implement the new architecture yet.

Tasks:

1. Inspect package.json, Next config, TypeScript config, ESLint, env, app routes, components, contexts, services, and types.
2. Inspect the FastAPI reference under the path available in the repository. Map each frontend service method to backend route, service, policy, event, and database entity.
3. Run install, lint, typecheck if available, and build. Record existing failures exactly.
4. Create `docs/generated/legacy-parity-matrix.md`.
5. Create `docs/generated/baseline-risks.md`.
6. Create `implementation-report.md`.
7. Do not move folders, install Drizzle/Better Auth, or rebrand in this task.

Acceptance:

- all current pages and service calls mapped;
- important business rules have source file references;
- existing failures separated from target work;
- no broad code change.
