# Prompt 13 Release Preparation

Date: 2026-07-10

## Environment Validation

Required runtime variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_URL` | yes | Public application URL, for local use `http://localhost:3000`. |
| `BETTER_AUTH_URL` | yes | Usually the same value as `APP_URL`. |
| `BETTER_AUTH_SECRET` | production yes | Minimum 32 characters. Local build has a fallback, production runtime must provide a real secret. |
| `DATABASE_URL` | production yes | MySQL 8 URL. Do not use production DB for development or tests. |
| `OUTBOX_CRON_SECRET` | staging/production yes | Minimum 32 characters. Used by protected outbox processing cron. |

Optional providers:

| Variable | Behavior When Missing |
| --- | --- |
| `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET` | Realtime publisher is disabled. Private channel auth returns 503 if server signing credentials are absent. |
| `NEXT_PUBLIC_PUSHER_APP_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Client realtime subscription is disabled when public key is absent. |
| `FCM_PROJECT_ID`, `FCM_ACCESS_TOKEN` | FCM adapter is disabled and returns zero sends. |
| `STORAGE_PROVIDER=local` | Files are stored under `LOCAL_STORAGE_ROOT`. |
| `STORAGE_PROVIDER=cloudinary` without full Cloudinary credentials | Upload/delete fails closed with an explicit credential error. |

## Local Seed Login Accounts

`npm run db:seed` creates Better Auth credential accounts with password:

```text
simadep@sakode
```

| Purpose | Email | Global Role | Department Role | Project Role |
| --- | --- | --- | --- | --- |
| Super admin | `myadmin.simadep@sakode.com` | `super_admin` | `member` in SIMADEP Department | none |
| Global admin | `global.admin.local@simadep.test` | `admin` | `member` in SIMADEP Department | none |
| Basic user | `user.local@simadep.test` | `user` | `member` in SIMADEP Department | none |
| Department head | `head.local@simadep.test` | `user` | `head` in SIMADEP Department | none |
| Department admin | `dept.admin.local@simadep.test` | `user` | `department_admin` in SIMADEP Department | none |
| Department member | `dept.member.local@simadep.test` | `user` | `member` in SIMADEP Department | none |
| Department viewer | `dept.viewer.local@simadep.test` | `user` | `viewer` in SIMADEP Department | none |
| Project owner | `owner.local@simadep.test` | `user` | `member` in SIMADEP Department | `owner` in SIMADEP Role Workflow |
| Project manager | `manager.local@simadep.test` | `user` | `member` in SIMADEP Department | `manager` in SIMADEP Role Workflow |
| Project contributor | `contributor.local@simadep.test` | `user` | `member` in SIMADEP Department | `contributor` in SIMADEP Role Workflow |
| Project viewer | `viewer.local@simadep.test` | `user` | `member` in SIMADEP Department | `viewer` in SIMADEP Role Workflow |

These are local/staging test credentials only. Do not reuse them in production.

## Empty Database Verification

The GitHub Actions MySQL integration template now validates the empty database path:

1. start MySQL 8 service container;
2. install dependencies;
3. run lint, typecheck, and unit tests;
4. generate/check Drizzle schema;
5. run migrations on an empty database;
6. run deterministic seed;
7. run integration tests with `RUN_DB_TESTS=1`.

Manual equivalent:

```bash
npm run db:migrate
npm run db:seed
$env:RUN_DB_TESTS='1'; npm run test:integration
```

## Legacy Data Import Mapping

Use the target UUID `id` as the application primary key and persist old integer IDs in nullable unique `legacy_id` columns where available.

| Legacy Source | Target Table | Mapping Notes |
| --- | --- | --- |
| legacy users | Better Auth `user` + `user_profiles` | Create Better Auth users first; store employee/profile fields in `user_profiles`; map legacy role to global role only when it was truly global. |
| departments/work units | `departments` | Store old department id in `legacy_id` if added later; current department table has no legacy id column, so keep import manifest mapping externally if needed. |
| department memberships | `department_members` | Resolve user and department by import map; preserve role/status; do not orphan last head. |
| projects | `projects` | Store legacy project id in `legacy_id`; resolve department and creator; set `version=1`. |
| project members | `project_members` | Resolve users/projects; owner, manager, contributor, viewer only; validate global admins as owners only. |
| milestones | `milestones` | Store legacy milestone id in `legacy_id`; preserve display order within project. |
| task categories | `task_categories` | Store legacy category id in `legacy_id`; preserve project-scoped uniqueness. |
| tasks/subtasks | `tasks` | Store legacy task id in `legacy_id`; resolve project, milestone, category, parent task; compute completion fields consistently. |
| assignees | `task_assignees` | Resolve task/user; validate assignee is project member. |
| comments | `comments` | Resolve task/user; preserve timestamps where available. |
| attachments | `attachments` | Import metadata first; migrate provider objects separately; keep storage cleanup retry plan for failures. |
| notifications | `notifications` | Optional import; prefer regenerating operational notification state only if needed. |
| audit logs | `audit_logs` | Optional import for compliance; never import secrets into `previous_data` or `new_data`. |

Import order:

1. users and profiles;
2. departments;
3. department memberships;
4. projects;
5. project members;
6. milestones and categories;
7. tasks and subtasks;
8. assignees;
9. comments and attachments;
10. notifications and audit logs.

## Staging Smoke Test Checklist

- Open `/api/health` and confirm HTTP 200.
- Open `/api/health?ready=1` and confirm HTTP 200 after migrations.
- Log in as `myadmin.simadep@sakode.com`.
- Verify dashboard loads without FastAPI.
- Verify `/users` is accessible for super admin.
- Verify department list and member management load.
- Verify project list/detail loads for owner, manager, contributor, and viewer accounts.
- Create a staging-only project, add a member, update status, then archive it.
- Create milestone, category, task, subtask, assignee, comment, link attachment, and local file attachment.
- Verify contributor can change assigned task status but cannot manage generic work item metadata.
- Verify notification dropdown and unread count respond to local DB changes.
- Trigger outbox manually with admin session or `Authorization: Bearer $OUTBOX_CRON_SECRET`.
- Verify Pusher/FCM remain disabled when env credentials are blank.

## Backup, Rollback, And Cutover Plan

Backup:

- Take a full MySQL dump before any staging/production migration.
- Export uploaded files/provider object inventory before attachment import.
- Store migration artifact version, Git commit SHA, and `.env` variable names used for the release.

Cutover:

- Freeze legacy writes.
- Run final legacy export.
- Run import against staging clone first.
- Run migration and import against target database.
- Run smoke checklist.
- Switch DNS/app routing only after smoke passes.

Rollback:

- Keep legacy application and database available until cutover is accepted.
- If migration/import fails before cutover, drop target database and restore from backup.
- If cutover fails after traffic switch, route traffic back to legacy app and keep target DB read-only for investigation.
- Do not edit already-applied migrations; create forward fix migrations.

## Health, Readiness, And Protected Outbox

- `GET /api/health`: public liveness check, no database dependency.
- `GET /api/health?ready=1`: readiness check, executes `select 1` against MySQL.
- `POST /api/jobs/outbox/process`: protected by either:
  - `Authorization: Bearer $OUTBOX_CRON_SECRET`, or
  - authenticated `super_admin`/`admin` session.

## Final Parity Checklist

| Area | Current Status |
| --- | --- |
| Branding | SIMADEP copy, metadata, font, and logo assets migrated. |
| Auth | Better Auth email/password sessions integrated. |
| Users | Global role management, ban/session revoke use cases present. |
| Departments | Browse, create/update/archive, members, roles, scoped navigation present. |
| Projects | List/filter/detail/create/update/archive/member management migrated. |
| Work items | Milestones, categories, tasks/subtasks, assignees, status action, my tasks present. |
| Collaboration | Comments, link/file attachment metadata, local storage adapter present. |
| Notifications | Inbox, unread count, device token registration, outbox processor present. |
| Realtime | Pusher adapter behind interface, disabled cleanly when env absent. |
| Reports/Audit | Dashboard/report/audit reads present with scoped queries. |
| Legacy FastAPI | No longer required at runtime. |

## Known Limitations

- Runtime rate limiting is planned but not wired.
- Cloudinary adapter is still a skeleton and must be completed before production file uploads.
- Project list pagination still slices after loading scoped rows to preserve summary behavior.
- E2E browser automation is not yet implemented.
- Local seed credentials are for development/staging smoke only and must not be deployed as production credentials.
- Department table currently lacks `legacy_id`; use an external import manifest for legacy department ID mapping unless a future migration adds it.
