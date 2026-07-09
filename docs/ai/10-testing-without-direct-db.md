# 10 — Testing Strategy Without Direct Remote Database

## Test pyramid

### Unit tests — always runnable by Codex

Test application use cases with fake repositories:

- create project creates owner and events;
- duplicate member rejected;
- owner cannot be removed;
- last admin cannot be demoted;
- assignee must be project member;
- only assignee changes status;
- completed timestamps calculated;
- notification recipients deduplicated;
- outbox retry state transitions.

No MySQL or network.

### Contract/schema tests — always runnable

- Zod input/output validation;
- status/role constants;
- error serialization;
- Drizzle schema compiles;
- migration generation produces files;
- no client module imports server-only code.

### Component tests — always runnable

- form validation;
- permission-controlled action rendering;
- loading/error/empty states;
- no business permission assumed solely from hidden UI.

### Integration tests — MySQL local/CI

- migration applies to empty DB;
- seed succeeds;
- repository filters enforce scope;
- unique constraints;
- FK delete behaviour;
- transaction rollback;
- optimistic version conflict;
- outbox and notification rows created atomically;
- Better Auth adapter schema works.

### E2E — local/CI

Critical flows:

1. admin signs in and creates user;
2. create department and add member;
3. create project and owner membership;
4. create milestone/task;
5. assign member;
6. assignee changes status;
7. comment and attachment metadata;
8. notification inbox update;
9. unauthorized cross-department access blocked.

## Commands

```bash
npm run test:unit
npm run test:component
npm run test:integration
npm run test:e2e
```

## Codex reporting rule

If MySQL is unavailable:

- run unit, contract, typecheck, lint, build;
- generate migration;
- do not run or claim integration tests;
- list exact local/CI commands the owner must run.

## CI integration database

Use MySQL service container with a disposable database. Never point CI to production or shared development DB.
