# Prompt 06 — Project Management Migration

Migrate project flows from legacy services/components into feature slices.

Tasks:

1. list/filter projects by actor scope, department, status, year, search;
2. project detail;
3. create project and atomic owner membership;
4. update status/metadata with optimistic version;
5. archive/delete policy;
6. add/remove/change project members;
7. owner protection and role validation;
8. audit, notifications, outbox;
9. update project UI callers to new server queries/actions;
10. remove only project legacy service methods proven unused.

Inspect FastAPI project route/service/repository/policies/events before implementation.
