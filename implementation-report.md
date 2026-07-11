# Implementation Report

## Prompt 15 Plan - Restore Project List and Project Detail UI/UX

Date: 2026-07-11

Scope:

- Restore project list UI parity while keeping server-side scoped project query and Server Actions.
- Add project UI capability DTO so mutation controls are not shown to actors who cannot perform them.
- Convert project detail page back to URL-driven tabs: Detail, Daftar Tugas, Kategori, and Laporan.
- Load only active tab data; keep assignable users and task collaboration lazy.
- Restore read-first project detail with schedule/member modals.
- Restore compact tasks tab with filters, milestone table rows, modals, popovers, delete confirmations, and task drawer.
- Restore categories as a separate tab.
- Keep report calculations while hiding developer-facing performance notes from production UI.

Out of scope:

- Drizzle schema or migration changes.
- Legacy AuthContext, bearer tokens, legacy frontend services, or old API contracts.
- Policy weakening.

## Prompt 15 Results - Restore Project List and Project Detail UI/UX

Completed:

- Added `ProjectUiCapabilities` to project list/detail DTOs:
  - `canEditProject`
  - `canArchiveProject`
  - `canManageMembers`
  - `canViewTasks`
  - `canManageTasks`
  - `canManageCategories`
  - `canViewReport`
- Hardened `listAssignableProjectUsers` so it now requires actor + project ID and checks member management capability before returning users.
- Added lazy route handlers:
  - `GET /api/projects/[id]/assignable-users`
  - `GET /api/tasks/[id]/collaboration`
- Restored project list interaction model with status tabs, year filter, search/department filter, project cards, create/edit modal, overflow edit/archive, archive confirmation, empty state, and pagination.
- Restored project detail shell with URL tab state and original-style header/status interaction.
- Removed permanent project edit/member management panels from detail page.
- Restored Detail tab read-first sections for description, schedule, and member summary with modals.
- Restored Tasks tab as compact milestone/table workflow instead of full inline task cards.
- Added task create/edit modal, milestone modal, assignee popover, category popover, delete confirmations, and lazy task drawer.
- Restored Categories tab as a dedicated category table with create/edit/delete modal flow.
- Report tab is now capability-gated and queried only when active.
- Removed "Catatan Performa Query" from project report UI.
- Added unit coverage for project UI capabilities, tab visibility, denied member management policy, and active-tab query plan.

Review notes:

- Server authorization remains final enforcement; UI capability props only control visibility.
- Task collaboration is no longer loaded with the task list and is fetched when the task drawer opens.
- Assignable users are fetched only when the member modal opens.
- The old `ProjectWorkItemsPanel` and `TaskCard` remain in the tree for now but are no longer used by the project detail route.
- Dev server was started on `http://localhost:3000`, but `/login` responded with HTTP 500 from the local dev runtime. Production build passed, so this appears to need separate local runtime log inspection rather than a compile failure.

Verification commands:

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
$env:RUN_DB_TESTS='1'; npm.cmd run test:integration
npm.cmd run check
```

Results:

- Lint passed.
- Typecheck passed.
- Unit tests passed: 17 files, 58 tests.
- Architecture test passed.
- Build passed.
- `db:generate` reported no schema changes.
- `db:check` passed.
- Integration tests passed: 9 files, 13 tests.
- `check` passed.

## Prompt 14 Plan - UI Parity Freeze and Specification

Date: 2026-07-11

Scope:

- Compare original project-related UI files from the legacy recovery source against the current SIMADEP implementation.
- Create a parity matrix covering project list, detail, members, schedule, tasks, milestones, task drawer, comments, attachments, categories, and reports.
- Create a role/capability visibility matrix for system, department, and project roles.
- Map original visual components into current feature-owned locations without copying legacy services or auth.
- Identify current UI controls that can be denied by the server and current eager queries that should become tab/modal/drawer lazy loads.
- Add screenshot checklist for the next implementation phase.

Out of scope:

- Runtime UI changes.
- Schema or migration changes.
- Policy weakening.
- Reintroducing bearer-token auth, legacy services, or old data contracts.

## Prompt 14 Results - UI Parity Freeze and Specification

Completed:

- Compared original project UI files from the legacy ZIP reference with current project, work-items, collaboration, and reporting implementation.
- Added generated specifications:
  - `docs/generated/ui-parity-matrix.md`
  - `docs/generated/ui-capability-matrix.md`
  - `docs/generated/ui-restoration-component-map.md`
  - `docs/generated/ui-screenshot-checklist.md`
- Documented current visible forms/actions that may be denied by server policy.
- Documented eager data loading that should be deferred until the related tab, modal, or drawer is opened.
- Preserved current backend/auth/DB/action architecture as the target implementation source of truth.

Review notes:

- The largest UI regression is that the current project detail page renders metadata, member management, work items, collaboration, and report panels all at once instead of the original tab/modal/drawer flow.
- Current server policies remain stronger than the visible UI in several places. Prompt 15 should add server-derived capability props before showing management controls.
- The report tab target should exclude contributor/viewer unless product policy explicitly expands report visibility.

Verification:

- No runtime code was changed for this prompt.
- No lint/typecheck/build was run because the acceptance criteria required documentation-only output.

## Prompt 13 Plan - Release Preparation

Date: 2026-07-10

Scope:

- Validate env schema and align deployment documentation with current runtime variables.
- Verify empty-DB migration path through CI template and local DB gates.
- Add deterministic local Better Auth seed accounts with passwords for role smoke testing.
- Prepare legacy data import mapping using existing `legacy_id` fields.
- Add staging smoke checklist plus backup, rollback, and cutover plan.
- Add/verify health/readiness endpoint and protected outbox cron route.
- Confirm optional providers fail closed or disable cleanly.
- Update README and architecture/environment docs.
- Produce final parity checklist and known limitations.

Out of scope:

- Production deployment.
- Production database connection.
- Real Cloudinary SDK implementation.
- Runtime rate limiter implementation.
- Automated legacy import executable.

## Prompt 13 Results - Release Preparation

Completed:

- Added deterministic local seed login accounts:
  - one super admin
  - one global admin
  - one basic user
  - one department head/project owner
  - one department admin
  - one department member
  - one department viewer
  - one project manager
  - one project contributor
  - one project viewer
- Seed accounts use Better Auth credential accounts with hashed password `SimadepLocal2026!`.
- Added release seed integration test to verify credential accounts exist and password hash verifies.
- Added public health endpoint:
  - `GET /api/health`
  - `GET /api/health?ready=1`
- Protected outbox processing with either:
  - `Authorization: Bearer $OUTBOX_CRON_SECRET`
  - authenticated `super_admin` or `admin` session
- Added cron bearer secret helper and unit tests.
- Updated MySQL GitHub Actions template to run migrations, seed, and DB integration tests from an empty database.
- Added provider fail-closed coverage for incomplete Cloudinary storage credentials.
- Updated environment contract and `.env.example` with `OUTBOX_CRON_SECRET` and current provider variable names.
- Updated README with local DB setup, seed credentials, health/readiness, and release checklist link.
- Produced release preparation report:
  - `docs/generated/release-preparation-prompt-13.md`

Review notes:

- Optional Pusher and FCM providers remain disabled when credentials are absent.
- Cloudinary still intentionally fails closed until the production adapter is implemented.
- Local seed credentials are for development/staging smoke only and must not be deployed to production.
- Department import currently needs an external legacy mapping manifest because the current department table has no `legacy_id`.

Verification commands:

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
$env:RUN_DB_TESTS='1'; npm.cmd run test:integration
npm.cmd run check
```

## Prompt 12 Plan - Security, Testing, and Performance Hardening

Date: 2026-07-10

Scope:

- Add denied-path tests for cross-department and cross-project access.
- Validate server action and internal API route authentication boundaries.
- Review SQL scoping, pagination limits, search inputs, and N+1 exposure.
- Test transaction rollback and optimistic conflict behavior.
- Confirm last-admin, department-head, and project-owner protection coverage.
- Review upload validation and realtime private channel authorization.
- Ensure logs and audit entries avoid raw secrets.
- Produce a rate limiting plan and security review report with remaining risks.

Out of scope:

- Runtime rate limiter implementation.
- E2E browser automation.
- Cloudinary production adapter implementation.
- Broad query refactors beyond focused hardening fixes.

## Prompt 12 Results - Security, Testing, and Performance Hardening

Completed:

- Added security boundary scan tests:
  - feature server actions must call `requireServerSession`
  - internal API routes must call `requireServerSession`
  - Better Auth catch-all route is explicitly excluded because it is delegated to the official Better Auth Next handler
- Added input contract hardening tests:
  - project pagination max page size and search length
  - notification inbox max limit
  - device token length
  - upload MIME, size, and file name validation
- Hardened upload file name validation by rejecting forward slash path separators.
- Added realtime channel auth parsing helper and tests:
  - self user channel only
  - project and department UUID channel forms
  - malformed/public channels rejected before provider signing
- Added DB integration hardening tests gated by `RUN_DB_TESTS=1`:
  - contributor cannot read the Sakode project through department filter
  - contributor cannot open an out-of-scope project detail
  - department head cannot read another department's members
  - stale project version is rejected without mutating the row
  - transaction rollback leaves no inserted test department row
- Produced security review report:
  - `docs/generated/security-review-prompt-12.md`

Review notes:

- Existing unit coverage already protects last privileged admin, self-demotion/self-ban, last department head, project owner removal/role change, task optimistic conflict, assignee membership, relation project matching, and contributor status action limits.
- Project list avoids per-row N+1 for task/member counts, but current pagination still loads all scoped rows before slicing to keep summaries simple.
- Audit entries avoid raw passwords and redact session tokens on revocation; future audit payloads must continue to avoid secret-bearing inputs.
- Rate limiting is documented as a plan only and remains a production hardening task.

Verification commands:

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
$env:RUN_DB_TESTS='1'; npm.cmd run test:integration
```

## Prompt 08 Plan - Comments and Attachments

Date: 2026-07-10

Scope:

- Inspect legacy FastAPI comments and attachment routes/services/events before implementation.
- Implement `src/features/collaboration` vertical slice for comment list/create/delete and attachment metadata for file/link.
- Define deletion policy: comment author or privileged project actor can delete comments; attachment uploader or privileged project actor can delete attachments.
- Add storage port, local development adapter, and Cloudinary provider skeleton without requiring real credentials in tests.
- Validate MIME type, size, file name, and external URL at server boundary.
- Keep DB/storage consistency by uploading before DB insert, deleting DB first, emitting outbox cleanup events on provider cleanup failure.
- Add audit/outbox events for comment and attachment mutations.
- Update task detail UI to show comments and attachments from new server queries/actions.
- Add tests without real Cloudinary/S3 credentials.

Out of scope:

- Real Cloudinary SDK integration and production credential usage.
- Realtime worker delivery for outbox events.
- Comment edit flow.
- Broad cleanup of legacy sidebar/comment components still retained for later cleanup.

## Prompt 08 Results - Comments and Attachments

Legacy inspected:

- `backend-management-project/app/api/routes/comment_route.py`
- `backend-management-project/app/api/routes/attachment_route.py`
- `backend-management-project/app/services/comment_service.py`
- `backend-management-project/app/services/attachment_service.py`
- `backend-management-project/app/core/domain/events/attachment.py`
- `backend-management-project/app/core/domain/handlers/attachments/cloudinary_handler.py`
- `backend-management-project/app/utils/cloudinary.py`

Completed:

- Added collaboration feature policy and contracts:
  - comment list/create/delete
  - link attachment metadata
  - file attachment metadata
  - MIME type, size, file name, and URL validation
- Added deletion policy:
  - comment author can delete own comment
  - privileged project actor can delete comments
  - attachment uploader can delete own attachment
  - privileged project actor can delete attachments
- Added storage port and adapters:
  - `StorageAdapter` port
  - local development adapter using `.local/uploads`
  - Cloudinary provider skeleton reading env and failing fast until SDK integration is intentionally added
- Added collaboration use cases:
  - task collaboration query
  - project task collaboration batch query
  - create/delete comment
  - create file/link attachment
  - delete attachment
- Implemented DB/storage consistency approach:
  - upload file object first
  - insert attachment metadata plus audit/outbox in one DB transaction
  - if DB insert fails after upload, attempt storage cleanup
  - if cleanup fails, enqueue `attachment.storage_cleanup_requested.v1` outbox event
  - delete attachment DB row and audit/outbox first, then attempt provider cleanup with outbox retry on failure
- Added server actions for comments and attachments.
- Updated project task detail UI:
  - task cards now show `Diskusi & Lampiran`
  - add/delete comments
  - upload/delete file attachments
  - add/delete link attachments
  - attach to task or to a specific comment
- Added env placeholders:
  - `STORAGE_PROVIDER`
  - `LOCAL_STORAGE_ROOT`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Added tests without real Cloudinary/S3 credentials:
  - collaboration policy/validation tests
  - local storage adapter test
  - DB integration scaffold for comments/attachments

Commands run:

```text
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run lint
RUN_DB_TESTS=1 npm.cmd run test:integration
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run test:architecture
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed with 7 files and 31 tests.
- `npm.cmd run lint`: passed with 26 legacy warnings.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed with 5 files and 5 tests.
- `npm.cmd run build`: passed.
- `npm.cmd run db:generate`: passed with no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run db:migrate`: passed.
- `npm.cmd run db:seed`: passed.
- `npm.cmd run check`: passed end to end.

Residual risk:

- Cloudinary adapter is a skeleton; real upload/delete requires explicit SDK integration and credential handling in a later hardening/deployment task.
- Local adapter returns `/uploads/...` URLs, but static serving for local upload files is not exposed yet.
- Legacy comment/attachment sidebar components and old services still exist because broader legacy cleanup is a later phase.

## Prompt 07 Plan - Milestones, Tasks, Categories, and Assignees

Date: 2026-07-10

Scope:

- Inspect legacy FastAPI milestone, task, category, assignee, policy, and event behaviour before implementation.
- Implement `src/features/work-items` vertical slice for milestone CRUD/order, task/subtask CRUD/order, categories, assignees, status actions, completion duration, task list, and my tasks.
- Keep project boundary invariants: milestone, task, parent, category, and assignees must belong to the same project.
- Enforce project role policy: owner/manager/global admin/department leadership manage work items; assigned contributors use a dedicated status action.
- Align task status and priority contracts with product docs.
- Update project detail and `/tasks` UI callers to use server queries/actions.
- Remove migrated legacy task/category/my-task callers only after active UI parity is in place.
- Add denied-path unit tests and MySQL integration tests.

Out of scope:

- Comments and attachments migration.
- Reporting/dashboard migration.
- Realtime delivery worker for outbox events.
- Broad refactor of unrelated legacy components.

## Prompt 07 Results - Milestones, Tasks, Categories, and Assignees

Legacy inspected:

- `backend-management-project/app/api/routes/milestone_route.py`
- `backend-management-project/app/api/routes/task_route.py`
- `backend-management-project/app/api/routes/category_route.py`
- `backend-management-project/app/api/routes/assignee_task_route.py`
- `backend-management-project/app/services/milestone_service.py`
- `backend-management-project/app/services/category_service.py`
- `backend-management-project/app/services/task_service.py`
- `backend-management-project/app/core/policies/task.py`
- `backend-management-project/app/core/domain/events/task.py`
- `backend-management-project/app/core/domain/events/assignee_task.py`

Completed:

- Added work item domain policy and contracts for:
  - task statuses `pending`, `in_progress`, `completed`, `cancelled`
  - task priorities `low`, `medium`, `high`
  - milestone CRUD/order
  - task/subtask CRUD/order
  - task categories
  - multiple assignees
  - dedicated task status action
  - my tasks list
- Added work item application use cases:
  - project work item tree query
  - current actor assigned tasks query
  - create/update/delete/reorder milestones
  - create/update/delete task categories
  - create/update/delete tasks and subtasks
  - assign/unassign task users
  - change task status through dedicated action
- Enforced work item rules:
  - all work item relations stay within the same project
  - assignee must already be a project member
  - project owner/manager/global admin/department leadership can manage work items
  - assigned contributors can change status only through the dedicated status action
  - stale task versions are rejected
  - completed tasks set `completed_at` and `finished_duration_minutes`
  - moving away from completed clears completion fields
  - milestones with tasks cannot be deleted
- Added audit log, notification, and outbox writes in the same transaction for work item mutations.
- Replaced active project detail work item UI with server queries/actions:
  - `src/features/work-items/ui/project-work-items-panel.tsx`
  - `src/features/work-items/ui/work-item-task-card.tsx`
  - `src/features/work-items/ui/work-item-action-form.tsx`
- Replaced `/tasks` with a server-rendered my-tasks page using the new query and status action.
- Aligned schema and seed task statuses from legacy `done/todo` style to target `completed/pending` style.
- Generated migration `src/infrastructure/db/migrations/0003_lying_harry_osborn.sql` and added data mapping for old enum values before the enum alter.
- Added work item denied-path unit tests and DB integration scaffold gated by `RUN_DB_TESTS=1`.
- Did not delete legacy `taskService`, `categoryService`, or retained legacy project detail components because report/comments/attachment legacy components still reference them and those areas are out of scope for Prompt 07.

Commands run:

```text
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run db:generate
npm.cmd run lint
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:migrate
npm.cmd run test:integration
npm.cmd run db:check
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed with 5 files and 24 tests.
- `npm.cmd run db:generate`: passed; generated `0003_lying_harry_osborn.sql`.
- `npm.cmd run lint`: passed with 26 legacy warnings.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run build`: passed; first attempt needed network permission for Next font fetch, rerun passed.
- `npm.cmd run test:integration`: passed with 4 DB integration files skipped because `RUN_DB_TESTS=1` was not set.
- `npm.cmd run db:check`: passed.
- `npm.cmd run check`: passed end to end.

DB local result:

- Initial `npm.cmd run db:migrate` failed because scripts were not loading `.env.local` and fell back to the old local URL.
- Added Next env loading for server env scripts and aligned local fallback/example DB URL to `simadep_app@simadep_dev`.
- Added `scripts/db/sql/fix-local-mysql-user.sql` for recreating the local MySQL user with `caching_sha2_password`.
- `npm.cmd run db:migrate`: passed after the local MySQL user fix.
- `npm.cmd run db:seed`: passed after adding deterministic seed rows for the Better Auth `user` table before `user_profiles`.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed with 4 files and 4 tests.

Residual risk:

- Remote hosted MySQL, such as Aiven, may require SSL connection options in the DB connection layer.
- Legacy task/category/report/comment/attachment components still exist because comments, attachments, and reporting are later phases.
- Project detail now exposes project lifecycle, membership, milestones, tasks, subtasks, categories, assignees, and status actions; report/comment/attachment panels are intentionally deferred.

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
## Prompt 09 - Notifications, Outbox, Realtime, and FCM

Date: 2026-07-10

### Objective And Scope

Implement the notification delivery baseline for SIMADEP without calling external providers inside business transactions.

Scope:

- Persistent notification inbox and unread count.
- Transactional outbox repository and processor.
- Pusher server adapter behind an interface.
- Private realtime channel auth with user/project/department membership checks.
- Minimal invalidation payloads only.
- FCM push adapter boundary and authenticated device-token registration, disabled when env is absent.
- Retry, idempotency, and failed/dead-letter behaviour.
- Notification dropdown migration from legacy FastAPI paths to local Next routes.

Out of scope:

- Installing Firebase Admin or Pusher server SDK packages.
- Running real Pusher or FCM network delivery in tests.
- Refactoring all legacy notification service code beyond the dropdown path needed for this phase.

### Implementation Plan

1. Add notification contracts/use cases for inbox list, unread count, mark read, mark all read, and device token registration/revocation.
2. Add outbox repository and processor with retry scheduling and terminal failure after max attempts.
3. Add realtime and push adapter interfaces plus disabled/fake-friendly provider implementations.
4. Add Next route adapters for notifications, device tokens, realtime auth, and optional outbox processing.
5. Update the client notification service/dropdown to use local routes and realtime invalidation.
6. Add unit tests around policies/adapters/processor and integration tests where local MySQL is available.
7. Run quality gates and record results.

### Results

Completed:

- Added persistent notification inbox use cases:
  - list inbox items
  - unread count
  - mark one notification read
  - mark all notifications read
  - register/revoke FCM device token
- Added local Next route adapters:
  - `GET/PATCH /api/notifications`
  - `PATCH /api/notifications/[id]/read`
  - `POST/DELETE /api/notifications/device-tokens`
  - `POST /api/realtime/auth`
  - `POST /api/jobs/outbox/process` guarded to `admin`/`super_admin`
- Added outbox infrastructure:
  - Drizzle outbox repository
  - due-event claim
  - stale processing release
  - retry backoff
  - terminal `failed` dead-letter state after max attempts
  - processed idempotency by never re-claiming `processed` events
- Added delivery adapters:
  - Pusher REST publish adapter behind `RealtimeAdapter`
  - disabled realtime adapter when env is absent
  - Pusher private-channel auth signature helper
  - FCM HTTP v1 adapter behind `PushAdapter`
  - disabled push adapter when env is absent
- Added private channel authorization:
  - `private-user-{userId}` requires same authenticated user
  - `private-project-{projectId}` requires project visibility
  - `private-department-{departmentId}` requires department visibility
- Added minimal invalidation payloads only:
  - `eventId`
  - `type`
  - optional `projectId`, `departmentId`, `taskId`, `resourceId`, `version`
  - `occurredAt`
- Updated notification client/dropdown:
  - reads `/api/notifications`
  - marks all read via local route
  - subscribes to `private-user-{id}`
  - refetches inbox on `simadep.invalidate`
  - removes legacy FastAPI notification paths from the active dropdown flow
- Added env placeholders:
  - `PUSHER_APP_ID`
  - `PUSHER_APP_KEY`
  - `PUSHER_APP_SECRET`
  - `PUSHER_CLUSTER`
  - `FCM_PROJECT_ID`
  - `FCM_ACCESS_TOKEN`
- Added `.local/` ignore for local storage output.
- Added tests:
  - outbox processor unit tests with fake repository/providers
  - realtime adapter unit tests with fake fetch
  - push adapter unit tests with fake fetch
  - notification DB integration scaffold

Commands run:

```text
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run lint
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
RUN_DB_TESTS=1 npm.cmd run test:integration
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed, 10 files / 39 tests.
- `npm.cmd run lint`: passed with 26 legacy warnings.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run build`: passed with the same legacy lint warnings and a non-blocking Node module type warning from `src/app/hero.ts`.
- `npm.cmd run db:generate`: passed, no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run db:migrate`: passed.
- `npm.cmd run db:seed`: passed.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed, 6 files / 6 tests.
- `npm.cmd run check`: passed.

Residual risks / next phase:

- Pusher and FCM adapters were tested with fakes only; no real provider credentials were used.
- FCM is implemented as an HTTP v1 boundary using `FCM_ACCESS_TOKEN`; production-grade Firebase Admin credential rotation is still a later hardening step.
- Outbox processing is exposed as a guarded manual route; a production scheduler/worker is still needed.
- Legacy notification/pusher service files still exist as compatibility wrappers for the current dropdown flow.
## Prompt 10 - Dashboard, Reports, and Audit

Date: 2026-07-10

### Objective And Scope

Migrate dashboard, project report, and audit activity reads to SIMADEP server-side queries while preserving existing project/task behaviour.

Scope:

- Admin/department/user dashboard query migration.
- Project report query migration.
- Audit activity query and UI.
- Permission-scoped reads for all reporting surfaces.
- Consistent project/task status and completion duration metrics.
- Avoid N+1 profile/membership loads through batched joins and grouped reads.
- Reuse existing presentational charts where safe.
- Add query tests, DB integration scaffold, and performance notes.

Out of scope:

- Broad redesign of dashboard visual system.
- Removing every legacy dashboard/report service file.
- Export/download report workflow.

### Implementation Plan

1. Add reporting metric helpers and typed query contracts.
2. Add scoped dashboard query that derives visible projects from global, department, and project memberships.
3. Add scoped project report query with assignee, priority, weekly activity, and duration metrics.
4. Add audit activity query with actor/project/department scoping.
5. Update dashboard page and project detail report UI to consume server query data.
6. Add tests for metrics/query scope and integration scaffolds.
7. Run quality gates and record results.

### Results

Completed:

- Added reporting application layer:
  - dashboard query contracts
  - project report query contracts
  - shared project/task metric helpers
  - project status counts
  - task status counts
  - completion rate
  - average completion duration in 24-hour days
- Migrated dashboard reads to server-side SIMADEP queries:
  - system dashboard for global admin actors
  - department dashboard for department head/admin actors
  - user dashboard for personal assigned-task metrics
  - scoped visible project list from global, department, and project membership
- Migrated project report reads:
  - project visibility checked before report query
  - task summary
  - assignee performance
  - priority distribution
  - weekly activity
  - estimation vs realization duration
  - milestone filter data
- Added audit activity query and UI:
  - actor/profile joined in one query
  - project/department/task context joined in one query
  - scoped by global role, department membership, project membership, or own activity
- Updated UI:
  - `/dashboard` now uses server-side reporting queries
  - dashboard reuses existing `StatCard` and `ProjectSummaryChart`
  - dashboard shows audit activity and query performance notes
  - `/projects/[id]` now renders the migrated project report panel
  - project report panel reuses existing Recharts chart components
- Prevented N+1 profile/membership loads:
  - dashboard loads projects, tasks, profiles, and scoped employees in batched queries
  - project report loads tasks, milestones, assignees, users, and profiles in batched joins
  - audit activity loads actor/profile/resource labels in one joined query
- Updated report DTO ID fields from legacy numeric IDs to target UUID/string IDs.
- Added tests:
  - unit tests for status counts, completion rate, and duration conversion
  - DB integration scaffold for dashboard and audit queries

Commands run:

```text
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run lint
npm.cmd run test:architecture
npm.cmd run db:generate
npm.cmd run build
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
RUN_DB_TESTS=1 npm.cmd run test:integration
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test:unit`: passed, 11 files / 41 tests.
- `npm.cmd run lint`: passed with 26 legacy warnings.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run db:generate`: passed, no schema changes.
- `npm.cmd run build`: passed with the same legacy lint warnings and a non-blocking Node module type warning from `src/app/hero.ts`.
- `npm.cmd run db:check`: passed.
- `npm.cmd run db:migrate`: passed.
- `npm.cmd run db:seed`: passed.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed, 7 files / 7 tests.
- `npm.cmd run check`: passed.

Residual risks / next phase:

- Legacy `DashboardContent`, `dashboardService`, and `reportService` remain for later cleanup once remaining callers are proven unused.
- Dashboard UI is intentionally conservative; broader visual redesign is deferred.
- Project report weekly activity is defined as daily created-plus-completed activity over the last 7 UTC days.
- Audit scope currently permits project members and department members to see scoped activity plus their own activity; stricter viewer/contributor distinctions can be refined in a later audit hardening phase.
## Prompt 11 - Legacy Cleanup

Date: 2026-07-10

### Objective And Scope

Remove legacy runtime dependencies after migrated flows pass tests and prove removed files have no remaining callers.

Scope:

- Remove unused `src/services` FastAPI client layer.
- Remove custom `AuthContext` and bearer-token based client auth flow.
- Remove legacy duplicated API types replaced by feature contracts.
- Remove public API base URL env/docs and old Pusher auth assumptions.
- Remove old/unused public assets and dead components.
- Verify FastAPI is no longer required at runtime.
- Update README/setup docs.
- Run non-DB and DB quality gates.

### Proof Before Removal

Caller searches were run before deletion for:

- `@/src/services`, `../services`, and individual service names.
- `AuthContext`, `useAuth`, `AuthProvider`, `token` usage in active app routes.
- Dead project/detail/dashboard/report component names.
- `NEXT_PUBLIC_API_SMIP_BASE_URL`, `NEXT_PUBLIC_API_SIMADEP_BASE_URL`, `API_BASE_URL`, `/v1/auth/pusher`, and FastAPI `/v1/*` paths.
- Old asset names including `logo-color.svg` and default Next/Vercel root assets.

Findings:

- Active routes no longer imported legacy project/task/collaboration/report/dashboard components.
- Remaining service imports were only inside the dead legacy component cluster.
- Active auth usage was limited to layout/login/sidebar/notification/users page and was migrated to Better Auth helpers.
- Active public assets are `public/brand/*`, `src/app/icon.svg`, and `public/not-found.svg`.

### Results

Completed:

- Removed the entire legacy FastAPI client service layer under `src/services`.
- Removed custom `src/context/AuthContext.tsx`.
- Added lightweight Better Auth client session helper in `src/features/identity/session-client.ts`.
- Migrated active login form to `authClient.signIn.email`.
- Migrated main layout/sidebar/notification dropdown away from AuthContext.
- Moved notification client store/realtime subscription into `src/features/notifications/client`.
- Migrated `/users` from client-side `userService` to server-side `listManagedUsers` and `setGlobalRoleAction`.
- Added `src/features/identity/users/index.ts` public API for user-management imports.
- Removed dead legacy dashboard/project/detail/report components after caller proof.
- Removed `DashboardConfig`, `ProjectFilterTabs`, and legacy duplicated API types no longer imported.
- Slimmed remaining active presentational types to remove references to deleted legacy API types.
- Removed unused public assets:
  - `public/logo-color.svg`
  - `public/file.svg`
  - `public/globe.svg`
  - `public/next.svg`
  - `public/vercel.svg`
  - `public/window.svg`
- Removed `NEXT_PUBLIC_API_SIMADEP_BASE_URL` from `.env.example`.
- Updated README to document current full-stack runtime and clarify FastAPI is no longer required.
- Cleaned ToastContext unused variables so lint now has zero warnings.

Post-cleanup verification searches:

- No `src/services` imports remain.
- No `AuthContext`, `useAuth`, or `AuthProvider` references remain.
- No `NEXT_PUBLIC_API_*`, `API_BASE_URL`, or old `/v1/auth/pusher` flow remains.
- No `SMIP`, `smip`, or `logo-color` runtime references remain.
- The only remaining `/v1/` string in `src` is the official FCM HTTP v1 endpoint.

Commands run:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
RUN_DB_TESTS=1 npm.cmd run test:integration
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with zero warnings.
- `npm.cmd run test:unit`: passed, 11 files / 41 tests.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run db:generate`: passed, no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run db:migrate`: passed.
- `npm.cmd run db:seed`: passed.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed, 7 files / 7 tests.
- `npm.cmd run check`: passed.

Residual risks / next phase:

- `src/types/dashboard`, `src/types/report`, and `src/types/notification` remain as active presentational DTOs for chart/dropdown components.
- The `/users` page is intentionally simplified to role management after removing legacy client table filters; richer user management forms can be rebuilt on feature server actions later.
- The build still uses provider adapters in disabled/skeleton mode when external credentials are absent.

## Prompt 16 - Role-Aware UI and Secondary Page Restoration

Date: 2026-07-11

### Objective And Scope

Restore role-aware navigation and secondary page density for dashboard, users, departments, and My Tasks while preserving Better Auth, Drizzle/MySQL, contextual policies, and server authorization.

Scope:

- Replace navigation decisions based on legacy display-role labels.
- Add server-derived navigation capabilities.
- Keep contextual department/project memberships visible through real capabilities.
- Move sensitive user creation and department/member management forms behind modal/progressive disclosure.
- Remove developer-facing performance notes from production dashboard UI.
- Add role/capability tests for actor types.

### Results

Completed:

- Added `src/features/navigation/domain/navigation-capabilities.ts` with a pure `deriveNavigationCapabilities` model.
- Added server wrapper and `/api/navigation/capabilities` route guarded by `requireServerSession`.
- Updated sidebar navigation to use server-derived capabilities:
  - `canViewUserManagement`
  - `canViewDepartments`
  - `canViewProjects`
  - `canViewMyTasks`
  - `dashboardScope`
- Replaced session display-role mapping so non-admin users are no longer forced into fake `Team Member` / `Project Manager` labels.
- Restored `/users` page density with search, role/status filters, role/status badges, `Tambah User` modal, and confirmation dialogs for global role changes, ban/unban, and session revoke.
- Added server actions for ban, unban, and revoke-session flows using existing user-management use cases.
- Restored `/departments` page density with create/edit/member modals, compact department cards, and status/role badges.
- Refined `/tasks` My Tasks page with compact status action and direct navigation to the active project tasks tab.
- Removed production dashboard rendering of query performance notes.
- Updated dashboard employee role labels to use real global roles (`Super Admin`, `Admin`, `User`) instead of legacy project/team role labels.
- Added navigation capability tests covering global admin, department leadership, department member, project-only contributor, and user without memberships.

### Notes

- Server authorization remains the final enforcement layer. UI capabilities only hide invalid controls and route entries.
- Department members are still loaded server-side on the department page to preserve current query/use-case behavior; the visible UI now uses progressive disclosure. A later performance pass can make member loading per-modal if needed.
- Dashboard query performance notes remain in reporting data/contracts for documentation/debug use, but are no longer displayed to end users.

### Verification

Commands run:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
RUN_DB_TESTS=1 npm.cmd run test:integration
npm.cmd run check
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run test:unit`: passed, 18 files / 63 tests.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run build`: passed; existing non-blocking module-type warning from `src/app/hero.ts` still appears.
- `npm.cmd run db:generate`: passed, no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run db:migrate`: passed.
- `npm.cmd run db:seed`: passed.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed, 9 files / 13 tests.
- `npm.cmd run check`: passed.
- After the dashboard role-label cleanup, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test:unit`, `npm.cmd run test:architecture`, and `npm.cmd run build` were rerun and passed.

## Prompt 17 - Visual Regression, Accessibility, and Cleanup

Date: 2026-07-11

### Objective And Scope

Lock restored UI parity so future backend work cannot silently flatten project, user, department, dashboard, and My Tasks screens.

Scope:

- Add Playwright visual and interaction coverage.
- Add source-level UI invariant tests that run with unit tests.
- Run accessibility pass for focus, labels, button names, and dialog semantics.
- Verify responsive desktop/mobile flows.
- Remove unused inline form files after restored modal/drawer components are proven.
- Document UI invariants and final visual regression report.

### Results

Completed:

- Added Playwright test tooling:
  - `@playwright/test`
  - `playwright.config.ts`
  - `tests/e2e/ui-parity.spec.ts`
  - `npm run test:e2e`
  - `npm run test:e2e:update`
- Added screenshot coverage for:
  - project list desktop/mobile;
  - project detail `Detail`, `Daftar Tugas`, `Kategori`, and `Laporan`;
  - create/edit project modal;
  - member modal;
  - task modal;
  - task detail drawer;
  - category popover and category modal;
  - task delete confirmation;
  - users page;
  - system, department, and user dashboard scopes.
- Added interaction coverage for:
  - URL-driven tabs and browser back/forward state;
  - modal open/close;
  - drawer open;
  - popover open;
  - destructive confirmation;
  - mobile and desktop viewport projects.
- Added source-level guard test `src/test/ui-invariants.test.ts` for:
  - tabbed project detail;
  - lazy report/work-item query plan;
  - progressive disclosure for sensitive forms;
  - capability-driven visibility;
  - destructive confirmations;
  - no legacy `AuthContext`, token storage, or `src/services` imports.
- Added custom dialog accessibility improvements:
  - `role="dialog"`;
  - `aria-modal="true"`;
  - labelled dialog titles;
  - Escape close;
  - Tab focus cycling.
- Added accessible names for restored raw form controls and icon-only buttons in users, departments, project list/detail, tasks, categories, notification dropdown, and task drawer flows.
- Removed unused inline UI files:
  - `src/features/identity/users/ui/user-create-form.tsx`
  - `src/features/projects/ui/project-forms.tsx`
- Added generated documentation:
  - `docs/generated/ui-invariants.md`
  - `docs/generated/ui-visual-regression-report.md`
- Updated README with local visual regression commands.
- Ignored Playwright generated artifacts with `/test-results` and `/playwright-report`.

### Verification

Commands run:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run test:architecture
npm.cmd run build
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
npm.cmd run db:seed
RUN_DB_TESTS=1 npm.cmd run test:integration
npm.cmd run check
npm.cmd run test:e2e -- --project=desktop-chromium
npm.cmd run test:e2e -- --project=mobile-chromium
npm.cmd run test:e2e -- --project=mobile-chromium -g "opens and closes project create and edit modals"
```

Results:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run test:unit`: passed, 19 files / 68 tests.
- `npm.cmd run test:architecture`: passed.
- `npm.cmd run build`: passed; existing non-blocking module-type warning from `src/app/hero.ts` still appears.
- `npm.cmd run db:generate`: passed, no schema changes.
- `npm.cmd run db:check`: passed.
- `npm.cmd run db:migrate`: passed.
- `npm.cmd run db:seed`: passed.
- `RUN_DB_TESTS=1 npm.cmd run test:integration`: passed, 9 files / 13 tests.
- `npm.cmd run check`: passed.
- `npm.cmd run test:e2e -- --project=desktop-chromium`: passed, 8 tests.
- `npm.cmd run test:e2e -- --project=mobile-chromium`: 7 passed, 1 dropdown stability failure.
- `npm.cmd run test:e2e -- --project=mobile-chromium -g "opens and closes project create and edit modals"`: passed after selector stabilization.

### Notes And Remaining Risk

- Full `npm.cmd run test:e2e` was attempted after setting Playwright `workers: 1`, but the required outside-sandbox browser execution was blocked by the current usage limit before it could rerun. The desktop suite passed fully, and the only mobile failure was rerun successfully after the patch.
- Playwright browser installation required writing to the user browser cache outside the workspace.
- npm reported existing dependency audit findings after adding Playwright. No `npm audit fix` was run because that can change dependency versions outside Prompt 17 scope.
- Screenshot tests currently capture artifacts instead of enforcing committed golden baselines. Golden image enforcement can be enabled after the owner approves the captured UI as canonical.

## Provider Wiring - Pusher, FCM, and Cloudinary

### Scope

- Keep Pusher as the realtime foreground invalidation provider.
- Keep FCM as the background push provider.
- Implement Cloudinary as the production-ready file storage provider behind the existing storage port.
- Preserve transactional outbox behaviour: no provider network call is made inside business transactions.
- Document provider setup so `.env.example` can be filled safely later.

### Changes

- Collaboration comment and attachment actions now create persistent notification inbox rows for project members, excluding the actor, in the same transaction as audit log and outbox event creation.
- The outbox processor now uses specific FCM titles/bodies for comment and attachment events while retaining minimal invalidation payloads.
- The task detail drawer subscribes to the project Pusher channel when public Pusher env is present and refreshes collaboration data for matching comment/attachment invalidations.
- Cloudinary storage adapter now supports signed HTTP upload and delete without adding a new dependency.
- `.env.example` and `docs/ai/11-environment-contract.md` now clarify local vs Cloudinary storage variables.
- Added `docs/generated/provider-setup-guide.md` covering Pusher, FCM, Cloudinary, device tokens, outbox cron, and troubleshooting.
- README now links to the provider setup guide.

### Notes

- `STORAGE_PROVIDER` remains required as the storage switch.
- `LOCAL_STORAGE_ROOT` is only used when `STORAGE_PROVIDER=local`; it can remain in `.env.example` as local/test fallback even when staging or production uses Cloudinary.
- FCM currently uses `FCM_ACCESS_TOKEN`, a short-lived OAuth token for FCM HTTP v1. Production should rotate this token or upgrade the adapter to service-account token generation in a later hardening pass.

## Project Task Display Modes - Kanban and Gantt

### Scope

- Add alternate task display modes inside the existing project task tab.
- Preserve current list view as the default behaviour.
- Reuse existing work-item queries, server actions, drawer, modal, popovers, and server authorization.
- Keep role/capability behaviour unchanged: management controls only render when the existing `workItems.canManage` flag allows them, while assigned users can still change task status.

### Changes

- Added URL-driven `taskView=list|kanban|gantt` mode resolution with fallback to `list`.
- Added segmented task view controls to the project task filter bar.
- Added Kanban board columns for task status using the existing task status action, assignee popover, category popover, task detail drawer, edit modal, subtask creation, and delete confirmation.
- Added Gantt view for scheduled tasks using task start/due dates, with an unscheduled task section for tasks without dates.
- Extracted task status control into a reusable component shared by list, Kanban, and Gantt.
- Added unit coverage for task view mode resolution.

### Notes

- Kanban and Gantt are display modes, not drag-and-drop schedulers. Status changes remain explicit server actions to preserve optimistic version checks and authorization.
- No schema or migration changes were required.
