# 13 — Refactor and Implementation Roadmap

## Phase 0 — Baseline

- install and run existing project;
- document current failures;
- map pages → services → FastAPI endpoints;
- create screenshots/flow notes;
- no architectural rewrite.

## Phase 1 — Rebrand and tooling

- rename product/package/metadata;
- update logo assets and company palette;
- configure Nunito;
- add typecheck/test scripts;
- fix baseline lint command;
- preserve existing functionality.

## Phase 2 — Architecture scaffold

- create `features`, `infrastructure`, `shared`, `test`;
- add dependency rules and server-only boundaries;
- move only generic primitives first;
- do not bulk move all components.

## Phase 3 — Database foundation

- install Drizzle/mysql2;
- define schema and relations;
- generate initial migration;
- create seed and migration scripts;
- add local Docker and CI MySQL setup;
- no production connection.

## Phase 4 — Better Auth and internal users

- Better Auth integration;
- session-based UI;
- internal user profile;
- admin user management;
- migrate/remove bearer token context;
- create bootstrap admin process.

## Phase 5 — Departments

- department CRUD/archive;
- memberships/roles;
- department-scoped navigation/filter;
- authorization tests.

## Phase 6 — Projects

- project query/create/update/archive;
- member management;
- ownership rules;
- migrate project pages and remove related legacy service calls.

## Phase 7 — Work items

- milestones/categories;
- task/subtask;
- assignees/status;
- split large legacy components;
- completion metrics.

## Phase 8 — Collaboration

- comments;
- attachment metadata and storage adapter;
- authorization and cleanup behaviour.

## Phase 9 — Notifications and realtime

- notification inbox;
- outbox table/processor;
- Pusher adapter/private channels;
- FCM adapter disabled by default.

## Phase 10 — Dashboard/report/audit

- role/scope-aware dashboard;
- project reports;
- audit UI/query;
- aggregation performance.

## Phase 11 — Legacy removal

- remove unused services/context/types;
- remove external API base URL;
- remove FastAPI dependency assumptions;
- verify no old logo/name/copy.

## Phase 12 — Hardening and release

- full CI;
- integration/E2E;
- security review;
- migration rehearsal;
- staging deployment;
- production cutover plan.

## Gate rule

Do not advance when current phase acceptance criteria fail. Schema and auth phases are blockers for later business modules.
