# Prompt 15 — Restore Project List and Project Detail UI/UX

Implement only project list and project detail UI parity. Preserve the integrated backend.

## Required references

Read:

- original project UI files;
- `docs/generated/ui-parity-matrix.md`;
- `docs/generated/ui-capability-matrix.md`;
- `docs/generated/ui-restoration-component-map.md`;
- current project/work-item/collaboration/report use cases, policies, server actions, and tests.

## Non-negotiable constraints

- Do not restore legacy API services or AuthContext.
- Do not modify Drizzle schema/migrations unless a proven capability query requires a minimal additive change.
- Do not weaken server authorization.
- Do not render all project features on one page.
- Do not show mutation controls to actors without the matching capability.
- Do not fetch report, collaboration, or assignable users before needed.
- Use HeroUI interactions consistent with the original frontend.

## Part A — capability-safe project DTO

Add or derive a project UI capability object:

```ts
{
  canEditProject,
  canArchiveProject,
  canManageMembers,
  canViewTasks,
  canManageTasks,
  canManageCategories,
  canViewReport
}
```

Server remains final enforcement.

Fix `listAssignableProjectUsers`:

- require actor and project ID;
- assert `canManageMembers` before returning users;
- support search/pagination if practical;
- do not load it on initial page render;
- load only when member modal opens.

## Part B — project list

Restore the original interaction model:

- role/capability-aware status tabs with counts;
- year filter control;
- project cards matching original hierarchy;
- create button, not permanent create form;
- create/edit project modal;
- project-card overflow menu for edit/archive;
- confirmation modal for archive/delete;
- original loading, empty, error, pagination behavior.

Keep the current server-side scoped query, URL filter contract, pagination, and Server Actions.

Create client view components under the project feature UI folder, not global legacy folders.

## Part C — project detail shell

Restore tabs:

- Detail;
- Daftar Tugas;
- Kategori;
- Laporan.

Use URL-driven tab state, for example `?tab=detail`, so refresh/back/forward preserve state.

Only load the active tab data.

Tab visibility must use new capabilities, not old global role strings.

Restore original-style project header:

- project title;
- status badge/dropdown;
- edit affordance only when allowed;
- tab navigation;
- no raw actor role/version badge unless needed for a debug environment.

## Part D — Detail tab

Render project metadata read-only by default.

Restore:

- description and schedule presentation;
- member summary/avatars;
- edit schedule modal;
- manage members modal;
- project edit modal or original inline-title behavior;
- archive action behind overflow/destructive confirmation.

Remove permanent `ProjectEditForm` and permanent `ProjectMembersPanel` from the page.

## Part E — Tasks tab

Restore compact task interaction:

- filter controls;
- milestone group rows;
- compact task rows;
- create/edit task modal;
- create/edit milestone dialog or controlled inline title edit matching original;
- task detail right drawer;
- assignee popover;
- category popover;
- delete confirmation;
- collaboration and attachment UI inside the task drawer.

Do not embed full edit, assignment, subtask, comments, and attachment forms in every task card.

Task detail/collaboration must load lazily when a task is selected.

Expose granular task capabilities:

```ts
{
  canEdit,
  canDelete,
  canAssign,
  canChangeStatus,
  canComment,
  canAttach
}
```

## Part F — Categories tab

Restore the original separate category table and create/edit/delete modal flow.

Remove category forms from the Tasks tab.

## Part G — Report tab

- render only if `canViewReport`;
- run report query only when tab is active;
- preserve current report calculations and chart components;
- remove developer-facing “Catatan Performa Query” from production UI; keep it in documentation/logging instead.

## Tests

Add/update:

- project tab visibility tests;
- no unauthorized controls rendered;
- assignable user query denied for viewer;
- only active tab query executes;
- task drawer lazy-load behavior;
- modal success/error behavior;
- project list create/edit/archive flow;
- build, lint, typecheck, unit, architecture tests;
- integration tests if MySQL is available.

## Acceptance criteria

- project list visually and behaviorally resembles original;
- project detail is tab-based;
- only one tab content is shown;
- all mutation actions use modal/drawer/popover/confirmation where original did;
- viewer/contributor no longer sees management forms;
- report and collaboration are lazy-loaded;
- no backend regression;
- no legacy API dependency restored.
