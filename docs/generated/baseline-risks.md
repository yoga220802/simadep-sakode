# Baseline Risks

Generated: 2026-07-09

## Executive Summary

This repository is still in a Phase 0 legacy frontend state. It has a Next.js App Router UI, custom bearer-token auth, client-side services that call an external `/v1` API, and no local FastAPI source available for deeper route/service/policy inspection. The target SIMADEP backend, database, Better Auth, Drizzle schema, and feature-driven architecture have not been implemented in this task.

## Current Technical Baseline

- `package.json` only defines `dev`, `build`, `start`, and `lint`; no `typecheck`, `test`, `test:unit`, `db:*`, or `check` scripts exist yet.
- `npm install` failed in the local environment, leaving lint/build unable to find the `next` binary.
- `npm run lint` invokes `next lint`; this is a legacy command and currently fails before linting because `next` is not recognized.
- `src/app/page.tsx` still contains default Next starter content, while middleware redirects `/` to `/login`.
- Auth state is stored in a custom `auth_token` cookie and revalidated through `GET /v1/users/me`.
- All active data access is client-side `fetch` through `NEXT_PUBLIC_API_SMIP_BASE_URL`.
- `middleware.ts` only protects `/dashboard` and `/projects`; `/tasks` and `/users` rely on client layout redirect rather than middleware redirect.
- `next.config.ts` allows remote images from avatar/placeholder/Cloudinary hosts.
- `.env.example` only contains public legacy API/Pusher values and still uses `NEXT_PUBLIC_API_SMIP_BASE_URL`.

## Architecture Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| External FastAPI remains runtime dependency | `src/services/*` call `NEXT_PUBLIC_API_SMIP_BASE_URL` `/v1/*` endpoints. | App cannot meet PRD goal of one full-stack Next.js codebase. | Migrate one feature at a time to server queries/actions per `docs/ai/13`. |
| Business logic lives in UI/client services | Components call services directly and transform API data in client service files. | Authorization and invariants can be assumed by UI instead of enforced server-side. | Server actions/use cases/policies per `docs/ai/04` and `docs/ai/07`. |
| Backend source unavailable | No FastAPI code or Python files found. | Route/service/policy/event mapping cannot be verified against actual legacy implementation. | Owner should add `legacy/backend-fastapi/` or provide readable reference before feature migration. |
| Large components exceed architecture guidance | `TaskDetailSidebar.tsx` 644 lines, `ProjectTaskView.tsx` 373 lines, `ManageMembersModal.tsx` 342 lines, `ReportCharts.tsx` 317 lines. | High regression risk when migrating work-item/collaboration flows. | Split only during feature migration with tests. |
| Layer-first structure persists | `src/components`, `src/services`, `src/types`, `src/context`. | Cross-cutting changes spread across folders. | Phase 2 scaffold; no broad move in Phase 0. |

## Security And Authorization Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| Bearer token handled in browser cookie/client context | `AuthContext.tsx` manages `auth_token`; services attach `Authorization: Bearer`. | Token theft or confused authorization boundaries remain possible. | Better Auth session, server-side session resolution. |
| Middleware is not authorization | Middleware checks token presence only and only for some paths. | Direct route access may render client shell before redirect; no resource-level decision. | Server-side policy checks on every read/write. |
| Role model mismatch | Current frontend roles: `Admin`, `Project Manager`, `Team Member`, `Viewer`; target global/dept/project roles differ. | Incorrect permissions during migration if mapped loosely. | Explicit role translation and contextual policy tests. |
| User IDs are legacy integers | Current API types use numeric user IDs; target IDs are UUID strings with nullable `legacy_id`. | FK/membership/auth mismatch risk. | Preserve explicit `legacy_id` mapping in schema and migration. |
| Pusher channel auth is legacy and public-base-url based | `pusherService` posts to `/v1/auth/pusher` and subscribes to `user-{id}`. | Private-channel scope can be spoofed if backend auth is weak; target requires verified private channels. | `/api/realtime/auth` with server session and membership checks. |

## Data And Business Rule Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| Legacy status uses `cancel` | `src/types/project.ts` has `ProjectStatus = ... | "cancel"`. | Target standard is `cancelled`; migration mapping needed. | Map legacy `cancel` to `cancelled` during data migration. |
| Project roles are incomplete | Current `ProjectRole` is `owner | contributor | viewer`; target also has `manager`. | Project manager capabilities may be lost or conflated. | Introduce target role constants with tests. |
| My tasks uses N+1 project fetches | `myTaskService.getMyTasks` fetches project detail per task. | Slow dashboard/task list and authorization duplication. | Single scoped server query with joined projection. |
| Category delete trusts `project_id` query input | `categoryService.deleteCategory` passes `project_id` from UI. | Cross-project relation corruption risk if server trusts it. | Derive project through category relation server-side (`docs/ai/18`). |
| Attachments need storage lifecycle design | Current service uploads files/links directly to legacy endpoints. | Orphaned files/rows and rollback inconsistency risk. | Storage port, metadata transaction, retry cleanup. |

## Tooling And Quality Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| Install is not reproducible in this environment | `npm.cmd install` failed: `npm error Exit handler never called!`. | Lint/build cannot validate project. | Repair local npm/cache or run clean CI install before migration. |
| Lint script is obsolete/broken | `npm run lint` -> `next lint`; binary missing after failed install. | Existing lint status unknown. | Phase 1 tooling update should use supported ESLint command. |
| No typecheck script | `npm run typecheck` reports missing script. | TypeScript baseline cannot be verified through npm script. | Add `typecheck: tsc --noEmit` in tooling phase. |
| No tests configured | No test scripts in `package.json`. | Business rule preservation lacks automated safety net. | Add unit/component/integration strategy incrementally. |
| Build unavailable | `npm run build` cannot find `next`. | Runtime/build defects unknown. | Re-run after install/tooling is fixed. |

## Existing Failures Recorded

```text
npm install
npm : File C:\src\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

```text
npm.cmd install
npm error Exit handler never called!
npm error This is an error with npm itself. Please report this error at:
npm error   <https://github.com/npm/cli/issues>
npm error Log files were not written due to an error writing to the directory: C:\Users\yogaa\AppData\Local\npm-cache\_logs
```

```text
npm.cmd run lint
> sistem-manajemen-dan-informasi-proyek@0.1.0 lint
> next lint

'next' is not recognized as an internal or external command,
operable program or batch file.
```

```text
npm.cmd run typecheck
npm error Missing script: "typecheck"
```

```text
npm.cmd run build
> sistem-manajemen-dan-informasi-proyek@0.1.0 build
> next build

'next' is not recognized as an internal or external command,
operable program or batch file.
```

## Recommended Next Phase Gates

- Add or restore a reproducible dependency install before any broad migration.
- Provide the FastAPI source under `legacy/backend-fastapi/` if exact service/policy/event parity is required.
- Keep Phase 1 limited to rebrand/tooling/script repair as described in `docs/ai/13-migration-roadmap.md`.
- Do not claim lint/typecheck/build/test pass until commands run successfully after install is fixed.

