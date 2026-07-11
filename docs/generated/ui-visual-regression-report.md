# UI Visual Regression Report - Prompt 17

Date: 2026-07-11

## Objective

Lock restored project and secondary UI interactions so future backend work cannot silently replace tabs, modals, drawers, popovers, confirmations, or capability-driven visibility with permanent inline forms.

## Automated Coverage Added

Playwright configuration:

- `playwright.config.ts`
- `tests/e2e/ui-parity.spec.ts`
- scripts:
  - `npm run test:e2e`
  - `npm run test:e2e:update`
- configured with one worker for stable shared-seed execution.

Screenshot coverage:

- project list desktop;
- project list mobile;
- project detail `Detail` tab;
- project detail `Daftar Tugas` tab;
- project detail `Kategori` tab;
- project detail `Laporan` tab;
- create project modal;
- edit project modal;
- member modal;
- task modal;
- task detail drawer;
- category popover;
- task delete confirmation;
- category modal;
- users page;
- system dashboard;
- department dashboard;
- user dashboard.

Interaction coverage:

- tab navigation preserves URL state;
- browser back/forward preserves active project tab;
- create/edit project modal opens and closes;
- member modal opens, traps focus, and closes;
- task modal opens and closes;
- task drawer opens;
- category popover opens;
- destructive task action opens confirmation;
- category modal opens and closes.

Accessibility coverage:

- custom dialogs have dialog semantics;
- custom dialogs support Escape close;
- custom dialogs cycle Tab focus;
- icon-only buttons used by restored flows have accessible labels;
- raw form controls in restored users/departments surfaces have accessible names;
- Playwright checks for unnamed buttons and unnamed form controls on target pages.

Responsive coverage:

- project list is captured at desktop and mobile viewport sizes;
- Playwright runs desktop Chromium and mobile Chromium projects.

## Cleanup Completed

Removed unused UI files with no active callers:

- `src/features/identity/users/ui/user-create-form.tsx`
- `src/features/projects/ui/project-forms.tsx`

Generated artifacts are ignored:

- `/test-results`
- `/playwright-report`

## Legacy Regression Checks

Automated source-level guards verify:

- no `AuthContext` or `useAuth`;
- no `NEXT_PUBLIC_API_SMIP_BASE_URL`;
- no active imports from `@/src/services`;
- no token storage in local/session storage;
- project detail remains tabbed and query-plan driven;
- report and collaboration are not loaded by default;
- destructive actions remain confirmation-driven.

## Runtime Prerequisites

`npm run test:e2e` expects:

- local MySQL schema migrated;
- deterministic seed applied;
- Playwright browser binaries installed.

Recommended setup:

```text
npm run db:migrate
npm run db:seed
npx playwright install chromium
npm run test:e2e
```

Seed accounts use the local-only password documented in the README:

```text
SimadepLocal2026!
```

## Known Limitations

- Screenshot tests currently capture regression artifacts rather than requiring committed golden image baselines. Golden snapshot enforcement can be enabled later by switching selected captures to `expect(page).toHaveScreenshot(...)` after the owner approves the captured UI as canonical.
- Full WCAG color contrast measurement is not yet automated; Prompt 17 added structural accessibility checks and labelled/focusable controls for restored flows.
- Prompt 17 verification passed the full desktop suite and reran the only failing mobile interaction successfully. A final full `npm run test:e2e` after switching to serial workers could not be rerun because outside-sandbox browser execution hit the current usage limit.
