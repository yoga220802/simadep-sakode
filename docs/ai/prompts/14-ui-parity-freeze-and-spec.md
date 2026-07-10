# Prompt 14 — UI Parity Freeze and Specification

You are working on the current SIMADEP repository after the backend integration phases are complete.

The original frontend repository is available as a read-only UI/UX reference. The current repository is the source of truth for backend architecture, database, authentication, authorization, events, and tests.

## Objective

Create an exact UI parity specification. Do not change runtime code in this task.

## Critical rule

The original repository is the source of truth for:

- information hierarchy;
- interaction patterns;
- tabs;
- modal usage;
- drawer usage;
- popovers;
- filters;
- card layouts;
- progressive disclosure;
- role-specific visible features.

The current repository is the source of truth for:

- Better Auth;
- Drizzle/MySQL;
- use cases and policies;
- Server Actions;
- server queries;
- transactions;
- audit/outbox/notifications;
- feature-driven structure;
- tests.

Do not reintroduce bearer-token auth, frontend services, legacy API calls, or old data types.

## Tasks

1. Compare every project-related original UI file against the current implementation.
2. Create `docs/generated/ui-parity-matrix.md` with rows for:
   - project list;
   - create/edit/delete project;
   - project header;
   - detail tab;
   - members;
   - schedule;
   - tasks tab;
   - milestones;
   - task create/edit/delete;
   - task detail drawer;
   - assignee popover;
   - category popover;
   - comments;
   - attachments;
   - categories tab;
   - report tab.
3. For each row include:
   - original component/path;
   - original interaction;
   - current component/path;
   - current interaction;
   - regression;
   - target interaction;
   - existing new server query/action to retain;
   - capability required;
   - acceptance criteria.
4. Create `docs/generated/ui-capability-matrix.md` for all system, department, and project roles.
5. Identify every current form/action visible to an actor who may be denied by the server.
6. Identify all current queries that load unnecessary data before the user opens the related tab/modal/drawer.
7. Create `docs/generated/ui-restoration-component-map.md` mapping original visual components to new feature-owned locations.
8. Add screenshots or screenshot checklist if browser tooling is available.
9. Update `implementation-report.md`.

## Forbidden

- no runtime UI code changes;
- no schema changes;
- no migration changes;
- no policy weakening;
- no removal of backend code;
- no copying legacy services/AuthContext;
- no redesign beyond original interaction parity.

## Acceptance

The next implementation prompt must be able to restore the project screens without making product or interaction assumptions.
