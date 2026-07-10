# UI Recovery Roadmap

## Step 0 — Preserve current backend milestone

Before UI changes:

```bash
git checkout -b chore/backend-integrated-baseline
git tag backend-integrated-v1
git push origin backend-integrated-v1

git checkout -b fix/ui-parity-restoration
```

Use the actual branch naming policy if different.

Do not mix schema migrations or backend feature additions into UI recovery unless they are strictly required for capability-safe rendering.

## Step 1 — Freeze UI source of truth

Create a documented UI parity matrix between:

- original repository;
- current repository;
- desired behavior.

Capture screenshots for:

- project list;
- project detail Detail tab;
- Tasks tab;
- Categories tab;
- Report tab;
- task drawer;
- member modal;
- project modal;
- role-specific states.

## Step 2 — Restore project list

Preserve:

- server-side scoped query;
- URL filters;
- pagination;
- capability checks;
- create/update/archive actions.

Restore:

- status filter tabs and counts;
- year filter UI;
- original card hierarchy;
- create/edit modal;
- edit/delete dropdown;
- confirmation modal;
- loading/empty/error states.

## Step 3 — Restore project detail shell

Build:

- `ProjectDetailShell` client component;
- HeroUI tabs;
- URL-driven active tab;
- role/capability-aware tab visibility;
- original-style project header;
- status dropdown only if allowed;
- inline title edit or edit modal according to original behavior.

Fetch only active tab data.

## Step 4 — Restore Detail tab

Restore read-first presentation:

- project description;
- schedule;
- members avatar summary;
- explicit buttons for edit schedule and manage members;
- metadata form not permanently visible;
- archive action behind overflow menu and confirmation.

## Step 5 — Restore Tasks tab

Restore:

- filter controls;
- compact milestone groups;
- compact task rows;
- create/edit modal;
- task detail right drawer;
- assignment and category popovers;
- destructive confirmations;
- collaboration inside drawer only;
- lazy task detail/collaboration loading.

## Step 6 — Restore Categories tab

Restore table and modal pattern. Category actions only for permitted users.

## Step 7 — Restore Report tab

Render only for `canViewReport`. Execute report query only when active.

## Step 8 — Role UX audit

Test as:

- super admin;
- admin;
- department head;
- department admin;
- project owner;
- project manager;
- contributor assigned to task;
- contributor not assigned;
- viewer.

For every role, record visible navigation, tabs, controls, and expected forbidden action.

## Step 9 — Secondary pages

Restore interaction density on:

- user management;
- departments;
- dashboard;
- My Tasks.

Do this only after project flows are approved.

## Step 10 — Visual regression

Add screenshot-based manual or Playwright checks at desktop and mobile widths. Prevent future backend prompts from silently replacing UI composition.
