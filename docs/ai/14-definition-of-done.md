# 14 — Definition of Done

A feature is done only when:

- user-facing acceptance criteria are met;
- input schema exists;
- application use case exists;
- authorization policy is server-enforced;
- repository query is scoped;
- transaction boundary is correct;
- audit/event/notification behaviour is defined;
- UI handles loading, success, empty, validation, forbidden, and failure states;
- unit tests cover happy and denied paths;
- DB integration test exists where persistence behaviour matters;
- lint and typecheck pass;
- build passes;
- no secret or server-only import leaks to client;
- documentation and implementation report updated;
- no unused legacy caller remains for migrated flow.

A phase is done only when:

- all prompt acceptance criteria checked;
- migration SQL reviewed;
- commands/results recorded;
- limitations explicitly listed;
- rollback/recovery implications documented;
- next phase prerequisites satisfied.
