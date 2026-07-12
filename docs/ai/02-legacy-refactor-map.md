# 02 — Legacy Refactor Map

## Current frontend

Repository frontend adalah Next.js 15 App Router dengan HeroUI, Tailwind CSS 4, TypeScript, Pusher client, dan service berbasis `fetch` ke backend eksternal.

Current layer-first folders:

```text
src/app
src/components
src/context
src/hooks
src/providers
src/services
src/types
```

Komponen yang perlu dipecah karena memiliki banyak responsibility antara lain:

- `TaskDetailSidebar.tsx`
- `ProjectTaskView.tsx`
- `ManageMembersModal.tsx`
- `ProjectReportView.tsx`
- halaman users

Current auth menggunakan custom context dan bearer token. Bagian ini harus diganti Better Auth session.

## Current backend

Backend FastAPI memiliki modul:

- authentication via API pegawai eksternal;
- users dan global roles;
- projects dan project members;
- milestones, tasks, subtasks, categories, assignees;
- comments dan attachments;
- notification;
- dashboard/report;
- audit log;
- domain events;
- Pusher, WebSocket, dan SSE.

## Target mapping

| Legacy area | Target feature/context | Strategy |
|---|---|---|
| `AuthContext`, `authService` | `features/identity/sign-in` | replace |
| `userService`, users page | `features/identity/manage-users` | rewrite + reuse UI selectively |
| project services/components | `features/projects/*` | migrate vertical slice |
| milestone/task services | `features/work-items/*` | rewrite business rules |
| comments | `features/collaboration/comments` | rewrite |
| attachments | `features/collaboration/attachments` | rewrite through storage port |
| notification dropdown/service | `features/notifications/inbox` | retain UI concept, replace data layer |
| dashboard service/components | `features/reporting/dashboard` | retain visual components, replace query layer |
| report components | `features/reporting/project-report` | rewrite query aggregation |
| Pusher service | `infrastructure/realtime` | adapter-based replacement |
| API pegawai | internal identity/profile | remove external dependency |
| SQLAlchemy models | Drizzle schema | translate intentionally, not one-to-one blind copy |
| Alembic migration | Drizzle migration | new baseline + data migration scripts |

## Migration strategy for frontend calls

Do not delete every legacy service immediately. For each migrated feature:

1. identify all UI callers;
2. create new server query/action;
3. update one page/flow;
4. add tests;
5. remove only unused service methods;
6. remove `NEXT_PUBLIC_API_SMIP_BASE_URL` after final caller is gone.

## Behaviour to preserve

- project creator becomes owner;
- admins can manage across project scope subject to policy;
- non-privileged users only see allowed project statuses and membership-scoped data;
- only authorized project leadership creates/updates/deletes tasks;
- task assignees can update task status;
- assignee must be project member;
- owner cannot be removed or demoted accidentally;
- admin cannot demote the final admin;
- task completion stores completion timestamp and duration;
- mutations create audit/event/notification where applicable.
