# SIMADEP UI Invariants

Date: 2026-07-11

These invariants protect the restored UI from being flattened by future backend or feature work.

## Project Detail

- Project detail must remain tabbed.
- The active tab must be URL-driven with `?tab=detail`, `?tab=tasks`, `?tab=categories`, or `?tab=report`.
- Refresh, back, and forward navigation must preserve the selected tab.
- Only the active tab data may be loaded:
  - work item data only for `tasks` and `categories`;
  - report data only for `report`;
  - collaboration/comments/attachments only after a task is selected.

## Progressive Disclosure

- Project create/edit/delete must use modal or confirmation UI.
- Project member management must use a modal.
- Task create/edit/delete must use modal, drawer, popover, or confirmation UI.
- Task detail must use the right drawer and must lazy-load comments/attachments.
- Category create/edit/delete must stay in the dedicated category tab flow.
- User creation must stay behind the `Tambah User` modal.
- Department create/edit/member management must stay behind modal/progressive disclosure.
- Password fields must not be permanently visible on the users page.

## Capability Visibility

- Navigation must be driven by server-derived capabilities, not display role strings.
- Project tabs and mutation controls must be driven by contextual capabilities.
- Viewer/contributor actors must not see management controls that the server would deny.
- Global role labels must not be used to infer project or department permissions.

## Destructive Actions

- Archive/delete/ban/revoke actions must require explicit confirmation.
- Confirmation UI must describe the target resource.
- Server authorization remains final enforcement for every destructive action.

## Accessibility And Responsiveness

- Custom dialogs must expose `role="dialog"`, `aria-modal="true"`, labelled titles, Escape close, and Tab focus cycling.
- Icon-only buttons must have accessible names.
- Raw inputs/selects/textareas must have a label, `aria-label`, or equivalent accessible name.
- Desktop and mobile breakpoints must be covered by screenshot tests.

## Automated Guards

- `src/test/ui-invariants.test.ts` verifies key source-level invariants in unit tests.
- `tests/e2e/ui-parity.spec.ts` captures screenshot and interaction coverage for restored UI flows.
- `npm run test:e2e` requires local seed data and Playwright browsers.
