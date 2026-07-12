# Baseline Risks

Generated: 2026-07-09

## Executive Summary

The legacy FastAPI backend source is now available and was inspected at `../backend-management-project/`. The frontend is still a legacy Next.js client application that calls `/v1` API endpoints through `NEXT_PUBLIC_API_SMIP_BASE_URL`; the target SIMADEP full-stack Next.js backend, Drizzle schema, Better Auth setup, transactional outbox, and feature-driven architecture have not been implemented in this audit task.

The backend source confirms several important business rules, but also reveals security, authorization, transaction, storage, database portability, and documentation/source conflicts that must be handled explicitly during migration.

## Current Technical Baseline

- `package.json` only defines `dev`, `build`, `start`, and `lint`; no `typecheck`, `test`, `test:unit`, `test:integration`, `db:generate`, `db:migrate`, or `db:seed` scripts exist yet.
- Previous `npm.cmd install` failed in the local environment, leaving lint/build unable to find the `next` binary.
- `npm run lint` invokes `next lint`, which is obsolete for current Next and currently fails before linting because `next` is not recognized after install failure.
- All active frontend data access is client-side `fetch` through `NEXT_PUBLIC_API_SMIP_BASE_URL`.
- Auth state is a legacy bearer token in browser-managed context/cookie and revalidated through `GET /v1/users/me`.
- Middleware only checks token presence for selected routes; resource authorization is not in frontend middleware.
- Backend source uses external employee API auth/profile source, PostgreSQL/SQLAlchemy, Cloudinary, optional Pusher/SSE/WebSocket realtime, and after-commit in-process event dispatch.

## Architecture Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| External FastAPI remains runtime dependency | `src/services/*` call `/v1/*`; exact backend route functions documented in `docs/generated/legacy-parity-matrix.md`. | App does not yet meet PRD goal of one full-stack Next.js codebase. | Migrate vertical slices into Next.js server actions/route handlers. |
| Layer-first frontend structure persists | `src/components`, `src/services`, `src/types`, `src/context`. | Changes remain spread across folders. | Move only during feature migration with tests. |
| Backend has service/repository architecture unlike target | `backend-management-project/app/services/*`, `app/repositories/*`. | File-for-file port would violate target architecture. | Preserve behavior, not structure; use feature slices. |
| Large legacy frontend components | `TaskDetailSidebar.tsx`, `ProjectTaskView.tsx`, `ManageMembersModal.tsx`, `ReportCharts.tsx`. | High regression risk in work-item/collaboration migration. | Split with tests during relevant slice only. |
| Runtime schema creation in backend | `backend-management-project/app/db/base.py::create_db_and_tables` called by `app/main.py::lifespan`. | Production schema drift risk if copied. | Target uses Drizzle migrations, never runtime `create_all`. |

## Security And Authorization Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| Legacy bearer-token auth depends on external employee API | `app/api/dependencies/authentication.py`, `app/client/pegawai_client.py`. | Availability/security boundary outside SIMADEP. | Better Auth session-first design; optional explicit employee sync adapter. |
| SSE user spoofing | `backend-management-project/app/sse.py::sse_endpoint` accepts `user_id` query and has TODO to replace with auth. | A client could bind to another user stream if route exposed. | Server-session realtime auth only. |
| WebSocket project subscription lacks membership check | `backend-management-project/app/websocket.py::websocket_endpoint` subscribes/unsubscribes project IDs from client messages after token auth. | Authenticated users may subscribe to unauthorized project signals. | Membership check per channel/project. |
| No legacy Pusher auth route found | Frontend `pusherService` expects `/v1/auth/pusher`; no matching route in backend source. | Current realtime auth contract may be broken or served elsewhere. | Implement target `/api/realtime/auth`; do not infer legacy behavior. |
| Route/service authorization mismatch | Project update/delete and category write routes allow admin/PM, but service often requires owner. | Users may see controls that fail server-side; migration could preserve wrong policy accidentally. | Owner decision for target admin/manager override; policy tests. |
| Task assignment member validation gap | `ensure_assignee_is_project_member` exists but `TaskService.assign_user` does not call it. | Non-project users may be assigned tasks. | Enforce same-project membership in target. |

## Transaction And Side-Effect Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| No transactional outbox | `SQLAlchemyUnitOfWork.commit` commits DB, then dispatches events; no outbox model found. | Audit/notification/realtime can fail after business commit. | Persist outbox rows atomically with business writes. |
| Audit logs written after commit in separate sessions | `app/core/domain/handlers/audit_handler.py::write_audit`. | Business action can succeed without audit. | Same transaction or outbox-backed audit worker. |
| Notification/realtime best-effort after commit | handlers under `app/core/domain/handlers/notifications/*` and `app/core/realtime/*`. | Notifications/signals can be lost. | Outbox + idempotent worker. |
| Cloudinary upload before DB insert | `AttachmentService.upload_attachment`. | Orphaned files or DB rows with `file_path="Error Uploading"`. | Storage intent + outbox/job; explicit failed status. |
| Cloudinary delete after DB row deletion | `AttachmentService.delete_attachment` emits delete event and removes row. | Provider file can remain with no DB metadata. | Tombstone/outbox retry. |

## Database And Portability Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| PostgreSQL-specific JSONB | `app/db/models/audit_model.py::AuditLog.details` uses `JSONB`. | Direct schema port fails on MySQL. | Convert to MySQL JSON. |
| PostgreSQL/asyncpg environment default | `backend-management-project/.env.example`, `app/core/config/settings.py`. | Target MySQL migration requires explicit type/query review. | Schema-first MySQL design and integration tests. |
| Legacy integer IDs | All SQLAlchemy models use integer PKs/FKs; external employee user IDs are integers. | Target UUID joins require careful mapping. | Preserve `legacy_id` nullable unique for migrated entities. |
| Missing optimistic version columns | `Project` and `Task` models have no version fields. | Concurrent edits may overwrite. | Add target optimistic version fields as intentional improvement. |
| Missing uniqueness constraints | Category name per project and display order constraints not found in model source. | Duplicate/order collisions possible. | Decide and enforce target constraints with migration cleanup. |
| Enum mismatch | Legacy project status uses `cancel`; target docs often use `cancelled`. | Status mapping bugs. | Explicit transformation table and tests. |

## Business Rule And Documentation Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| Global `project_manager` does not map cleanly to target roles | `Role.PROJECT_MANAGER`; target has system, department, and project roles. | Over-permission or under-permission after migration. | Owner decision for role mapping. |
| No legacy department model | Model inventory has no departments. | Department PRD behavior is target-only. | Introduce department slice intentionally, not as parity. |
| Project report is admin-or-owner only | `ProjectService.get_project_report`. | Target manager/dept reporting expectations may differ. | Owner decision and policy tests. |
| Task transition table is not enforced | `ALLOWED_TASK_STATUS_TRANSITIONS` exists but enforcement call is commented/not used. | Target may accidentally add behavior not present in legacy. | Decide whether transition enforcement is target improvement. |
| Attachment comment upload is author-only | `AttachmentService.create_comment_attachment`. | Admin/owner may be unable to add attachments to others' comments if preserved. | Owner decision. |

## Tooling And Quality Risks

| Risk | Evidence | Impact | Target mitigation |
|---|---|---|---|
| Install is not reproducible in this environment | Previous `npm.cmd install` failed: `npm error Exit handler never called!`. | Lint/build cannot validate frontend. | Repair npm/cache or run clean CI install before migration. |
| Lint script is obsolete/broken | `package.json` has `"lint": "next lint"`. | Existing lint status unknown. | Update tooling in dedicated phase. |
| No typecheck/test/db scripts | `package.json` missing target scripts. | Quality gates incomplete. | Add scripts in tooling phase. |
| Backend tests absent in source inventory | No backend test files found beyond `pytest.ini`. | Parity lacks executable legacy safety net. | Build target unit tests from documented rules. |

## Existing Frontend Command Failures From Phase 0

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

- Resolve role-mapping decisions for legacy `project_manager`, target `super_admin`, department roles, and project `manager`.
- Fix frontend install/tooling before any runtime migration validation.
- Start with auth/user/profile and project read slices; do not port backend files mechanically.
- Add policy tests for every source-proven rule before replacing each endpoint.
- Add transactional outbox/storage adapter design before migrating notifications, realtime, or attachments.
