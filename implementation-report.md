# Implementation Report

## Prompt 06 Plan - Project Management Migration

Date: 2026-07-10

Scope:

- Inspect legacy FastAPI project routes, services, policies, and domain events before implementation.
- Migrate project list/detail/create/update/archive/member management into `src/features/projects`.
- Replace `/projects` and `/projects/[id]` route callers with server queries/actions.
- Enforce actor-scoped queries, department filters, status/year/search filters, optimistic version checks, owner protection, and project role validation.
- Write audit logs, notifications, and outbox events for project mutations.
- Generate schema migration needed for project status contract alignment.
- Add denied-path unit tests and DB integration test scaffold.

Out of scope:

- Work item/task/category/report migration.
- Applying migrations or seeding a database.
- Removing legacy project service methods still referenced by retained legacy task/report components.

## Prompt 06 Results - Project Management Migration

Legacy inspected:

- `backend-management-project/app/api/routes/project_route.py`
- `backend-management-project/app/api/routes/project_member_route.py`
- `backend-management-project/app/services/project_service.py`
- `backend-management-project/app/core/policies/project_member.py`
- `backend-management-project/app/core/policies/query_policies.py`
- `backend-management-project/app/core/domain/events/project.py`
- `backend-management-project/app/core/domain/events/project_member.py`

Completed:

- Added project feature policy and contracts:
  - `src/features/projects/domain/project-policy.ts`
  - `src/features/projects/application/contracts.ts`
- Added project application use cases:
  - actor resolution
  - scoped project list
  - project detail
  - assignable departments/users
  - create project with atomic owner membership
  - optimistic metadata/status update
  - archive project through `deleted_at`
  - add/change/remove project member
- Enforced project rules:
  - global admins can manage all projects
  - department head/admin can create/manage department projects
  - project owner/manager can manage project metadata and members
  - contributor/viewer can view scoped projects
  - owner cannot be removed through generic member removal
  - owner role cannot be changed through generic role update
  - members cannot remove themselves or change their own role
  - global admins can only be assigned as project owners
  - stale optimistic versions are rejected
- Added audit log, notification, and outbox writes in the same transaction for project mutations.
- Added server actions:
  - `src/features/projects/server/project-actions.ts`
- Replaced project route UI callers:
  - `/projects` now uses server-side scoped query/filtering and server action create.
  - `/projects/[id]` now uses server-side detail query plus server actions for metadata/archive/member management.
- Added project status contract alignment:
  - `projects.status` enum now uses `tender`, `active`, `completed`, `cancelled`
  - seed data updated from `draft` to `tender`
  - generated `src/infrastructure/db/migrations/0002_cloudy_storm.sql`
- Added tests:
  - project policy denied-path unit tests
  - DB integration scaffold gated by `RUN_DB_TESTS=1`
- Did not remove legacy `projectService` methods because `rg` shows they are still referenced by retained legacy task/category/report components and `myTaskService`.

Commands run:

```text
npm.cmd run typecheck
npm.cmd run db:generate
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run lint
npm.cmd run build
npm.cmd run db:check
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed with 4 files and 16 tests.
- `npm.cmd run test:integration`: passed with 3 DB integration files skipped because `RUN_DB_TESTS=1` was not set and no local MySQL run was requested.
- `npm.cmd run lint`: passed with 26 legacy warnings.
- `npm.cmd run build`: passed; `/projects` and `/projects/[id]` are dynamic server-rendered routes.
- `npm.cmd run db:generate`: passed; final rerun reported no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run check`: passed end to end.

Not run:

- `npm.cmd run db:migrate`: skipped because no local MySQL instance was started or confirmed.
- `npm.cmd run db:seed`: skipped for the same reason.

Residual risk:

- Task/category/report components still contain legacy project service calls and should be migrated during work-items/reporting prompts before deleting `projectService`.
- The new project UI is intentionally focused on project lifecycle and membership; task/category/report tabs were not carried forward in Prompt 06 to avoid implementing out-of-scope features.
- Project status enum migration should be applied only through the normal local/CI migration workflow.

## Prompt 05 Plan - Department Management

Date: 2026-07-10

Scope:

- Implement department browse/create/update/archive vertical slice.
- Implement department member management with `head`, `department_admin`, `member`, and `viewer` roles.
- Add department policies, scoped queries, audit logs, and outbox events.
- Add `/departments` route and department-aware sidebar navigation/filter.
- Add denied-path unit tests and MySQL integration test scaffold.

Out of scope:

- Project implementation beyond using existing project relation scaffolding.
- Applying migrations or seeding against a database.
- Broad legacy project/task UI refactors.

## Prompt 05 Results - Department Management

Completed:

- Added department feature policy and contracts:
  - `src/features/departments/domain/department-policy.ts`
  - `src/features/departments/application/contracts.ts`
- Added department application use cases:
  - scoped department browse
  - create department
  - update department
  - archive department
  - list members
  - add member
  - update member role/status
  - deactivate member
  - list assignable users
- Enforced department rules:
  - global `super_admin/admin` can manage all departments
  - department `head/department_admin` can manage their own department
  - `member/viewer` can only view scoped departments
  - last active `head` cannot be demoted/removed without another active head
- Added audit and outbox writes in the same transaction for department mutations.
- Added server actions:
  - `src/features/departments/server/department-actions.ts`
- Added `/departments` page:
  - search/status filters
  - create form for global admins
  - update/archive controls
  - member add/update/deactivate controls
- Added department-aware navigation:
  - sidebar link to `/departments`
  - middleware protection for `/departments`
- Added tests:
  - denied-path policy unit tests
  - DB integration scaffold gated by `RUN_DB_TESTS=1`
- No schema change was required; existing Prompt 03 department tables were sufficient.

Commands run:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run test:integration
npm.cmd run build
npm.cmd run check
```

Results:

- `npm.cmd run lint`: passed with the existing 27 legacy warnings.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed with 3 files and 11 tests.
- `npm.cmd run test:integration`: passed with 2 DB integration files skipped because `RUN_DB_TESTS=1` was not set and no local MySQL run was requested.
- `npm.cmd run build`: passed; `/departments` is built as a dynamic route.
- `npm.cmd run db:generate`: passed through `npm.cmd run check`; no schema changes.
- `npm.cmd run db:check`: passed through `npm.cmd run check`.
- `npm.cmd run check`: passed end to end.

Not run:

- `npm.cmd run db:migrate`: skipped because no local MySQL instance was started or confirmed.
- `npm.cmd run db:seed`: skipped for the same reason.

Residual risk:

- Department management UI is functional but intentionally compact; richer UX polish can follow once the owner validates workflows.
- Member assignment currently lists all unbanned users visible to a department manager/global admin; future organization scoping can narrow this further if required.
- Existing project/task/dashboard legacy token service calls remain outside Prompt 05 scope.

## Prompt 04 Plan - Better Auth and Internal User Management

Date: 2026-07-10

Scope:

- Integrate Better Auth with Drizzle/MySQL and the official Next.js route pattern.
- Add server session helpers and a Better Auth client wrapper.
- Progressively replace the custom bearer-token `AuthContext` as the login/session source.
- Add Better Auth schema tables and migration while keeping SIMADEP `user_profiles`.
- Add global role/admin user management use cases with last-admin protection, ban/unban, session revoke, and audit writes.
- Add local bootstrap admin process using env values.
- Add unit tests and DB integration test scaffold that runs only when explicitly enabled.

Out of scope:

- Departments/projects feature implementation or data-backed UI migration.
- Production database access or applying migrations.
- Full removal of every legacy token consumer in project/task screens.

## Prompt 04 Results - Better Auth and Internal User Management

Completed:

- Installed Better Auth and the official Drizzle adapter package.
- Added Better Auth tables to Drizzle schema:
  - `user`
  - `session`
  - `account`
  - `verification`
- Added `user_profiles.user_id` foreign key to Better Auth `user.id`.
- Added Better Auth config with:
  - Drizzle adapter provider `mysql`
  - email/password sign-in
  - admin plugin
  - `super_admin`, `admin`, and `user` role mapping
  - Next cookies plugin
- Added auth route:
  - `src/app/api/auth/[...all]/route.ts`
- Added server session helpers:
  - `src/infrastructure/auth/session.ts`
- Added client auth wrapper:
  - `src/features/identity/auth-client.ts`
- Migrated `AuthContext` away from custom cookie storage and legacy `authService` login/revalidation.
- Updated middleware to use Better Auth session cookie checks for optimistic redirects.
- Added admin/user management policy and use cases:
  - create managed user
  - upsert profile
  - list managed users
  - set global role
  - ban/unban user
  - revoke one or all user sessions
  - audit log writes
  - self-demotion and last-active-admin protection
- Added local bootstrap admin script:
  - `npm run auth:bootstrap-admin`
  - reads `SIMADEP_BOOTSTRAP_ADMIN_*` env values
  - does not store production credentials in repo
- Added ADR:
  - `docs/adr/0003-better-auth-session-and-user-management.md`
- Generated Better Auth migration:
  - `src/infrastructure/db/migrations/0001_absent_steel_serpent.sql`
- Added tests:
  - schema compilation test updated for Better Auth tables
  - user management policy unit test
  - DB integration test scaffold gated by `RUN_DB_TESTS=1`

Commands run:

```text
npm.cmd install better-auth @better-auth/drizzle-adapter
npm.cmd run typecheck
npm.cmd run db:generate
npm.cmd run test:unit
npm.cmd run lint
npm.cmd run db:check
npm.cmd run test:integration
npm.cmd run build
npm.cmd run check
```

Results:

- `npm.cmd run lint`: passed with the existing 27 legacy warnings.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed with 2 files and 7 tests.
- `npm.cmd run test:integration`: passed with 1 DB integration file skipped because `RUN_DB_TESTS=1` was not set and no local MySQL run was requested.
- `npm.cmd run build`: passed; build includes `/api/auth/[...all]`.
- `npm.cmd run db:generate`: passed; final rerun reported no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run check`: passed end to end.

Not run:

- `npm.cmd run db:migrate`: skipped because no local MySQL instance was started or confirmed, and no remote database should be used.
- `npm.cmd run db:seed`: skipped for the same reason.
- `npm.cmd run auth:bootstrap-admin`: skipped because it requires local MySQL and local bootstrap env values.

Residual risk:

- Existing project/task/dashboard components still pass a compatibility `token` from `useAuth()` into legacy services. The source is now Better Auth session data, but those feature calls should be removed during the relevant feature migration prompts.
- Better Auth production runtime requires real `BETTER_AUTH_SECRET` and `DATABASE_URL`; build-only fallbacks exist only so local/CI compilation can run without secrets.
- npm continues to report existing audit findings after installs; no automatic fix was run to avoid unrelated dependency churn.

## Prompt 03 Plan - MySQL and Drizzle Foundation

Date: 2026-07-10

Scope:

- Install Drizzle ORM/Kit, MySQL driver, Zod env validation, tsx, and Vitest.
- Implement MySQL schema from `docs/ai/05-database-schema-and-drizzle.md` while excluding Better Auth managed tables.
- Add schema relations, lazy DB connection, transaction helper, UUID helper, env validation, and server-only infrastructure guard.
- Add Drizzle config, migration/check/migrate/seed scripts, deterministic seed data, local MySQL compose file, and GitHub Actions integration template.
- Generate the initial migration without applying it to any database.
- Add schema compilation tests and run quality gates.

Out of scope:

- Better Auth installation or generated auth tables.
- UI feature migrations to database-backed use cases.
- Remote database access, production credentials, or applied migrations.

## Prompt 03 Results - MySQL and Drizzle Foundation

Completed:

- Installed runtime dependencies: `drizzle-orm`, `mysql2`, and `zod`.
- Installed tooling/test dependencies: `drizzle-kit`, `tsx`, and `vitest`.
- Added Drizzle schema ownership files under `src/infrastructure/db/schema`:
  - identity/user profile
  - departments and department members
  - projects and project members
  - milestones, task categories, tasks, and task assignees
  - comments and attachments
  - notifications and device tokens
  - audit logs
  - transactional outbox events
- Excluded Better Auth managed tables (`user`, `session`, `account`, `verification`) and documented the temporary logical user-id boundary in `docs/adr/0002-drizzle-schema-with-better-auth-boundary.md`.
- Added relations in `src/infrastructure/db/schema/relations.ts`.
- Added lazy MySQL pool/Drizzle connection and transaction wrapper:
  - `src/infrastructure/db/connection.ts`
  - `src/infrastructure/db/transaction.ts`
- Added server env validation in `src/infrastructure/env/server.ts`.
- Added UUID helper in `src/shared/utils/uuid.ts`.
- Added `drizzle.config.ts`.
- Added scripts:
  - `db:generate`
  - `db:check`
  - `db:migrate`
  - `db:seed`
  - `db:studio`
  - `test:integration` placeholder
- Updated `check` to run lint, typecheck, unit tests, architecture test, build, db generation, and db check.
- Added deterministic seed design and seed runner:
  - bootstrap admin placeholder profile
  - department head and contributor profiles
  - Sakode and Engineering departments
  - bootstrap project membership
  - milestones, task categories, tasks, and task assignees
- Added local MySQL 8 compose service in `docker-compose.yml`.
- Added GitHub Actions MySQL integration template in `.github/workflows/mysql-integration.yml`.
- Added schema compilation tests in `src/infrastructure/db/schema/schema.test.ts`.
- Generated initial migration:
  - `src/infrastructure/db/migrations/0000_cute_mikhail_rasputin.sql`
  - Drizzle meta snapshot under `src/infrastructure/db/migrations/meta`.

Commands run:

```text
npm.cmd install drizzle-orm mysql2 zod
npm.cmd install -D drizzle-kit tsx vitest
npm.cmd run typecheck
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run test:unit
npm.cmd run lint
npm.cmd run build
npm.cmd run check
```

Results:

- `npm.cmd run lint`: passed with the existing 27 legacy warnings.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed with 1 Vitest file and 2 tests.
- `npm.cmd run test:architecture`: passed through `npm.cmd run check`.
- `npm.cmd run build`: passed; build still reports the existing legacy lint warnings and the existing Node module type warning for `src/app/hero.ts`.
- `npm.cmd run db:generate`: passed; final rerun reported no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run check`: passed end to end.

Not run:

- `npm.cmd run db:migrate`: skipped because no local MySQL instance was started or confirmed for this prompt, and no remote database should be used.
- `npm.cmd run db:seed`: skipped for the same reason.
- `npm.cmd run test:integration`: skipped because integration tests require a local MySQL service and are still represented by a template/placeholder.

Residual risk:

- Auth user referential integrity is intentionally deferred until Better Auth is installed and its generated schema is known.
- npm reported existing package audit findings after dependency installation; no automatic `npm audit fix` was run because it may introduce unrelated version changes.
- The database seed is deterministic and idempotent by unique keys, but has not been executed against MySQL in this prompt.

## Prompt 02 Plan - Feature-Driven Architecture Scaffold

Date: 2026-07-10

Scope:

- Add target folder boundaries for `src/features`, `src/infrastructure`, `src/shared`, and `src/test`.
- Add public `index.ts` API convention with minimal examples.
- Add server-only infrastructure boundary and import rules.
- Move only truly generic primitives where safe.
- Add ADR for the temporary coexistence between legacy folders and target vertical slices.
- Add an architecture guard to prevent client components from importing server-only/database infrastructure.

Out of scope:

- Bulk moving project/task components.
- Drizzle, Better Auth, database adapters, migrations, and business logic migration.

## Prompt 02 Results - Feature-Driven Architecture Scaffold

Completed:

- Added feature boundary examples and public API indexes:
  - `src/features/index.ts`
  - `src/features/identity/index.ts`
  - `src/features/identity/sign-in/index.ts`
  - domain placeholders for departments, projects, work-items, collaboration, notifications, reporting, and audit.
- Added server-only infrastructure scaffold:
  - `src/infrastructure/server-only.ts`
  - `src/infrastructure/db/index.ts`
  - `src/infrastructure/db/schema/index.ts`
  - placeholder boundaries for auth, events, jobs, realtime, storage, and push.
- Added shared/test scaffolds:
  - `src/shared`
  - `src/shared/ui`
  - `src/test/factories`
  - `src/test/fakes`
  - `src/test/fixtures`
- Moved generic Pagination UI to `src/shared/ui/Pagination.tsx`.
- Kept `src/components/common/Pagination.tsx` as a compatibility re-export and updated the projects page to import from `src/shared/ui`.
- Added `docs/adr/0001-feature-driven-architecture-scaffold.md` to document the temporary coexistence with legacy folders.
- Added `scripts/test-architecture.mjs` and `npm run test:architecture`.
- Updated `npm run check` to include the architecture test.

Commands run:

```text
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:architecture
npm.cmd run build
```

Results:

- `npm.cmd run lint`: passed with the existing 27 legacy warnings.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed placeholder.
- `npm.cmd run test:architecture`: passed and reported `Architecture boundaries passed.`
- `npm.cmd run build`: passed. Build still reports existing lint warnings and the existing Node module type warning for `src/app/hero.ts`.

Residual risk:

- Legacy `src/components`, `src/services`, `src/context`, and `src/types` remain in place by design until vertical slices migrate.
- The architecture guard currently blocks client imports of infrastructure/server-only modules and deep imports into future feature internals; it does not yet enforce every dependency direction for legacy folders.

## Prompt 01 Plan - Rebrand, Logo, And Tooling

Date: 2026-07-10

Scope:

- Rename visible product identity from SMIP / old project wording to SIMADEP.
- Apply Nunito through Next font optimization.
- Add SIMADEP brand tokens while preserving existing CSS token aliases used by the legacy UI.
- Replace the old `public/logo-color.svg` raster-in-SVG with native SVG assets under `public/brand/` and `src/app/icon.svg`.
- Update login, app shell logo usage, root/auth metadata, favicon source, README, and environment naming.
- Preserve existing frontend API calls; rename the public API base URL to `NEXT_PUBLIC_API_SIMADEP_BASE_URL` with a compatibility fallback for existing `NEXT_PUBLIC_API_SMIP_BASE_URL`.
- Add baseline scripts for lint, typecheck, unit placeholder, build, and check.
- Run available quality gates and record results.

Out of scope:

- Drizzle, Better Auth, database access, backend refactor, and broad feature-folder restructuring.

## Prompt 01 Results - Rebrand, Logo, And Tooling

Completed:

- Visible product identity updated to `SIMADEP` / `Sistem Manajemen Departemen`.
- Root and login metadata updated.
- Nunito applied through `next/font/google`.
- SIMADEP brand tokens added in `src/app/globals.css`; legacy CSS aliases remain mapped to the new palette.
- Native SVG assets added:
  - `public/brand/simadep-logo-full.svg`
  - `public/brand/simadep-logo-compact.svg`
  - `public/brand/simadep-mark.svg`
  - `public/brand/simadep-logo-dark.svg`
  - `public/brand/simadep-logo-mono.svg`
  - `src/app/icon.svg`
- `public/logo-color.svg` was initially replaced with native SVG markup; the owner-provided exact Sakode logo follow-up below superseded it for visual fidelity.
- Login, header, homepage, favicon metadata, alt text, README, package identity, and env example updated.
- API callers now use `NEXT_PUBLIC_API_SIMADEP_BASE_URL` through `src/config/api.ts`, with temporary fallback to `NEXT_PUBLIC_API_SMIP_BASE_URL` so existing local env files keep working.
- Baseline scripts added/fixed: `lint`, `typecheck`, `test:unit`, `build`, and `check`.
- ESLint ignores generated output directories such as `.next/`.

Commands run:

```text
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
```

Results:

- `npm.cmd run lint`: passed with 27 existing warnings, mainly unused imports/variables and hook dependency warnings in legacy feature code.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed placeholder.
- `npm.cmd run build`: first sandboxed run failed because Next could not fetch Nunito from Google Fonts (`EACCES`); rerun with approved network access passed. Build still reports the same non-blocking lint warnings and webpack cache restore warnings, but exited successfully.

Not run:

- Drizzle, Better Auth, database generation, migrations, seeds, and integration tests, per Prompt 01 scope.

Residual risk:

- `NEXT_PUBLIC_API_SMIP_BASE_URL` remains only as an internal compatibility fallback and should be removed during the legacy cleanup phase.
- Existing lint warnings were not fixed because they are outside the rebrand/tooling scope.

## Prompt 01 Follow-Up - Exact Sakode Logo

Date: 2026-07-10

Completed:

- Copied the owner-provided logo file from `C:\Users\yogaa\Document Local\SAKODE\LOGO\Logo\SIMADEP-Sakode-logo-exact.svg` into `public/brand/simadep-sakode-logo-exact.svg`.
- Updated homepage, login form, and dashboard header logo usage to the exact Sakode logo asset.
- Replaced `public/logo-color.svg` with the same exact logo so legacy logo references resolve to the requested visual.
- Adjusted login logo container width to preserve the wider logo ratio.

## Prompt 01 Follow-Up - Exact Logo Asset Set

Date: 2026-07-10

Completed:

- Replaced all main logo asset variants with the owner-provided exact logo source:
  - `public/brand/simadep-logo-full.svg`
  - `public/brand/simadep-logo-compact.svg`
  - `public/brand/simadep-logo-dark.svg`
  - `public/brand/simadep-logo-mono.svg`
  - `public/logo-color.svg`
- Reworked `public/brand/simadep-mark.svg` and `src/app/icon.svg` as small-format variants based on the exact logo's cloud outline, node motif, and orange `S`, so favicon/mark usage remains readable at small sizes.
- Kept `public/brand/simadep-sakode-logo-exact.svg` as the canonical source asset used by visible UI.

Verification:

- `npm.cmd run lint`: passed with the same 27 legacy warnings.
- `npm.cmd run typecheck`: passed when run sequentially after build cache regeneration.
- `npm.cmd run test:unit`: passed placeholder.
- `npm.cmd run build`: initially hit generated webpack cache corruption, so `.next/cache` was cleared; the next sandboxed run failed only because Nunito needed Google Fonts network access; rerun with approved network access passed.

Date: 2026-07-09

## Objective And Scope

Prompt 0.5 exact FastAPI source audit for the SIMADEP migration baseline. This task treated `../backend-management-project/` as a read-only legacy backend reference and replaced earlier inferred FastAPI assumptions with source-level evidence.

No SIMADEP runtime implementation, rebrand, Drizzle, Better Auth install, folder move, backend source change, database connection, migration, FastAPI server startup, external employee API call, Cloudinary call, or Pusher call was performed.

## Backend Workspace Folder Inspected

- `C:\Users\yogaa\Document Local\SAKODE\WEB DEVELOP\simadep\backend-management-project`

## Instructions And Documents Read

- `AGENTS.md`
- `CODEX_START_HERE.md`
- All files directly under `docs/ai/*.md`
- All phase prompts under `docs/ai/prompts/*.md`
- Existing `docs/generated/legacy-parity-matrix.md`
- Existing `docs/generated/baseline-risks.md`
- Existing `implementation-report.md`
- Relevant source files under `../backend-management-project/app/**`

## Backend Source Files Inspected

- Application entry/config: `app/main.py`, `app/api/api.py`, `app/db/base.py`, `app/db/uow/sqlalchemy.py`, `app/core/config/settings.py`, `app/core/config/api_pegawai.py`.
- API routes: all files under `app/api/routes/`.
- Dependencies: `app/api/dependencies/authentication.py`, `user.py`, `uow.py`.
- Services: all files under `app/services/`.
- Repositories: all files under `app/repositories/`.
- SQLAlchemy models: all files under `app/db/models/`.
- Schemas: all files under `app/schemas/`.
- Policies: all files under `app/core/policies/`.
- Events/subscribers/handlers: `app/core/domain/**`.
- Realtime: `app/sse.py`, `app/websocket.py`, `app/core/realtime/**`.
- Storage/external clients: `app/utils/cloudinary.py`, `app/client/pegawai_client.py`.
- Database migrations/config: `alembic.ini`, `app/db/**`, `alembic/versions/*.py`.
- Environment/tooling docs: `.env.example`, `requirements.txt`, `pyproject.toml`, `uv.lock`, `pytest.ini`, `README.md`.

## Counts Discovered

| Item | Count |
|---|---:|
| Python source files inventoried | 169 |
| API v1 endpoint functions | 47 |
| Additional realtime/test endpoint functions | 8 |
| Total decorated backend endpoint functions | 55 |
| SQLAlchemy table model classes | 10 |
| Service files/classes | 10 |
| Repository files | 11 |
| Domain event classes | 17 |
| Alembic version files | 25 |
| Backend test files found | 0, excluding `pytest.ini` |

## Documentation Files Created Or Updated

- Created `docs/generated/fastapi-source-inventory.md`
- Updated `docs/generated/legacy-parity-matrix.md`
- Created `docs/generated/legacy-database-model.md`
- Created `docs/generated/legacy-business-rules.md`
- Created `docs/generated/legacy-authorization-model.md`
- Created `docs/generated/legacy-events-and-side-effects.md`
- Created `docs/generated/legacy-auth-and-user-source.md`
- Created `docs/generated/legacy-storage-and-attachments.md`
- Created `docs/generated/documentation-source-conflicts.md`
- Created `docs/generated/backend-migration-order.md`
- Updated `docs/generated/baseline-risks.md`
- Updated `implementation-report.md`

## Commands Run

Static/read-only inspection commands only:

```text
Get-ChildItem
rg --files
rg / Select-String source searches
Get-Content -Raw for selected source and documentation files
Python AST parsing for route/model/service/event inventory
git status / source inventory checks where needed
```

No command started the backend, connected to a database, ran migrations, called an external API, called Cloudinary, or called Pusher.

## Commands Intentionally Not Run

- `uvicorn`, FastAPI startup, or any backend server command.
- Alembic migrations or database seed scripts.
- PostgreSQL/MySQL connection checks.
- External employee API, Cloudinary, and Pusher calls.
- Backend dependency installation.
- Drizzle or Better Auth installation.
- Frontend install/lint/typecheck/build reruns, because Prompt 0.5 allowed static commands and the exact existing frontend failures were already recorded in `docs/generated/baseline-risks.md`.

## Existing Failures Separated From Target Work

The frontend quality gate failures recorded in Phase 0 remain existing baseline failures:

- PowerShell `npm install` blocked by execution policy.
- `npm.cmd install` failed with `npm error Exit handler never called!`.
- `npm.cmd run lint` failed because `next` is not recognized after install failure.
- `npm.cmd run typecheck` failed because no `typecheck` script exists.
- `npm.cmd run build` failed because `next` is not recognized after install failure.

This Prompt 0.5 task introduced documentation-only changes and did not modify runtime code.

## Key Source Findings

- Legacy auth delegates login/token validation/profile data to an external employee API through `PegawaiService`.
- Legacy local user state is only `user_role`; no local user profile table was found.
- Project creator becomes owner.
- Last-admin and admin self-demotion protections are implemented.
- Project/member/task/category/comment/attachment permissions are enforced partly in route dependencies and partly in service/repository checks.
- Project update/delete and category write operations have route/service authorization mismatches.
- Task assignment does not enforce target assignee project membership, even though a policy helper exists.
- Events dispatch after DB commit; audit/notification/realtime/storage side effects are not transactional.
- Cloudinary upload/delete has consistency gaps.
- SSE/WebSocket realtime has important authorization gaps.
- Backend uses PostgreSQL-specific JSONB and integer IDs; target uses MySQL and UUID IDs with `legacy_id`.
- No `/v1/auth/pusher` route was found in backend source, despite frontend expectation.

## Unresolved Issues / Owner Decisions

- Map legacy global `project_manager` into target system/department/project roles.
- Decide how to seed/use target `super_admin`, because legacy has only `admin`.
- Decide migration source for department roles; no legacy department model exists.
- Decide whether target project `manager` is inferred from legacy `project_manager`, added manually, or introduced only for new data.
- Decide whether admin should override project/category owner checks where legacy route and service disagree.
- Decide whether to enforce task status transition rules in target; legacy source defines a table but does not enforce it.
- Decide whether comment attachment author-only behavior should be preserved.

## Recommended Next Prompt

Proceed with an owner-decision prompt before implementation:

1. Resolve role mappings: `project_manager`, `super_admin`, department roles, project `manager`.
2. Resolve admin override semantics for project/category mutations.
3. Confirm target improvements that intentionally differ from source: transactional outbox, assignment membership enforcement, realtime auth, storage consistency, optimistic versioning.
4. Then start the first implementation slice: Better Auth/user profile/role bootstrap with tests and no broad folder moves.

## Acceptance Criteria Checklist

- [x] `backend-management-project/` inspected as authoritative legacy backend source.
- [x] Every available API v1 backend endpoint linked to route function and source path.
- [x] Additional realtime/test endpoints documented.
- [x] Current frontend pages and service callers mapped.
- [x] Business rules linked to source functions.
- [x] SQLAlchemy entities and relationships inventoried.
- [x] Authentication and authorization behavior documented.
- [x] Domain events and side effects mapped.
- [x] Documentation assumptions compared against source and classified.
- [x] No backend source files modified.
- [x] No database or external service contacted.
- [x] No SIMADEP runtime implementation performed.
