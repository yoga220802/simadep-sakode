# 09 — Server Actions, Queries, and Route Contracts

## Internal web reads

Prefer server query functions called directly from Server Components:

```ts
getDashboardForActor(actor)
listProjectsForActor(actor, filters)
getProjectDetailForActor(actor, projectId)
listMyTasks(actor, filters)
listUsersForAdmin(actor, filters)
```

Do not call `/api/...` from a Server Component in the same application.

## Internal web mutations

Server Actions:

- create/update/archive project;
- add/remove/change project member;
- create/update/delete milestone;
- create/update/delete task;
- change task status;
- assign/unassign user;
- create/delete comment;
- mark notification read;
- admin user changes.

Every action:

1. resolves session;
2. parses FormData/object with Zod;
3. invokes one use case;
4. returns serializable result;
5. revalidates relevant path/tag.

## Route Handlers

Required:

- `/api/auth/[...all]` Better Auth;
- `/api/realtime/auth` private channel auth;
- `/api/uploads` or signed upload endpoint;
- `/api/webhooks/*` provider callbacks;
- `/api/health` liveness/readiness;
- `/api/jobs/outbox` protected cron dispatch;
- optional `/api/v1/*` only if external/mobile clients are planned.

## Pagination contract

```ts
interface PageRequest {
  page: number;
  pageSize: number;
}
interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

Enforce maximum page size.

## Filter contracts

Project filters:

- query text;
- status;
- department;
- start year/end year;
- membership scope;
- sort field/direction.

Task filters:

- project;
- status;
- priority;
- assignee;
- due range;
- category;
- search.

All filters validated and mapped to safe query builder input.
