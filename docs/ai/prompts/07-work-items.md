# Prompt 07 — Milestones, Tasks, Categories, and Assignees

Implement vertical slices for:

- milestone CRUD/order;
- task/subtask CRUD/order;
- task categories;
- multiple assignees;
- task status action;
- completion duration;
- task list/my tasks.

Rules:

- relations must stay in the same project;
- assignee must be project member;
- owner/manager/admin manage tasks;
- assigned contributor may change status through dedicated action;
- completed fields consistent;
- split oversized legacy components by capability;
- add unit and integration tests;
- remove migrated legacy service callers only after parity.
