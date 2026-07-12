# 04 — Backend Technical Specification

## 1. Backend shape

The backend lives inside Next.js but must remain a proper application layer. It consists of:

- authenticated server queries;
- server actions for internal mutations;
- route handlers for integration boundaries;
- use cases containing business orchestration;
- policies containing authorization and invariant rules;
- repository interfaces;
- Drizzle repository implementations;
- transaction manager;
- audit/event/notification orchestration;
- storage, realtime, and push adapters.

## 2. Request lifecycle

```text
Client/UI
  → Server Action or Route Handler
  → session lookup
  → Zod validation
  → authorization policy
  → application use case
  → transaction
       → repository writes
       → audit log
       → notification rows
       → outbox event
  → transaction commit
  → serializable DTO/result
  → optional cache revalidation
```

## 3. Error contract

Use typed application errors:

- `UnauthenticatedError`
- `ForbiddenError`
- `ValidationError`
- `NotFoundError`
- `ConflictError`
- `InvariantViolationError`
- `RateLimitError`
- `InfrastructureError`

Server action result:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
      };
    };
```

Do not expose SQL, stack trace, provider payload, or internal identifiers unnecessarily.

## 4. Transaction contract

Provide a transaction abstraction:

```ts
export interface TransactionManager {
  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
```

All repositories used in one transaction receive the same transaction context. Do not instantiate separate DB connections inside the use case.

## 5. Cache and revalidation

- Initial data may be rendered in Server Components.
- Do not cache user-scoped authorization-sensitive data globally.
- After mutation, revalidate the narrowest path/tag.
- Realtime event causes client query invalidation; it is not the data source.

## 6. Feature backend requirements

### Identity

- sign in/out;
- session retrieval;
- password reset/verification as required;
- admin create/update/ban/unban user;
- global role management;
- profile management;
- session revoke;
- internal user search for membership assignment.

### Department

- create/update/archive department;
- list department visible to actor;
- membership lifecycle;
- department role management;
- prevent orphaned department without active head unless explicit transfer/archive flow.

### Project

- create project under a department;
- creator becomes owner;
- list/filter by status, year, department, membership;
- update project metadata/status;
- soft archive/delete according to policy;
- member add/remove/role update;
- prevent owner removal/demotion without ownership transfer.

### Work items

- milestones ordered per project;
- tasks ordered per milestone;
- nested subtasks through `parent_id`;
- category belongs to same project;
- assignee must be project member;
- task creator/owner/admin rules;
- assignee status-change rule;
- completion metrics;
- prevent cross-project relation corruption.

### Collaboration

- comments require task visibility;
- delete comment by author or privileged actor;
- attachments require validated ownership and storage metadata;
- file delete occurs safely with DB consistency and retry strategy.

### Notifications

- persistent inbox rows;
- mark one/all read;
- recipient selection from domain event;
- no self-notification unless explicitly useful;
- realtime signal after commit through outbox worker;
- FCM optional and non-blocking.

### Reporting

- dashboard result depends on actor scope;
- query only columns needed;
- aggregate using SQL where reasonable;
- consistent status and duration definitions;
- no N+1 user/profile query.

### Audit

- immutable append-only record;
- actor, action, resource, before/after/detail, timestamp, correlation ID;
- sensitive credential/token never recorded.

## 7. Background work

For first release, provide an outbox processor callable by:

- protected cron route;
- platform scheduled job;
- CLI command for local development.

Processing rules:

1. select pending rows with bounded batch;
2. claim rows using status/lock strategy;
3. dispatch adapters;
4. mark delivered;
5. increment attempt and store safe error on failure;
6. exponential retry;
7. dead-letter after max attempts.

## 8. Observability

Every mutation should have a correlation/request ID. Structured logs include event name, actor ID, resource ID, duration, success/failure, but no passwords, tokens, full file contents, or database URL.
