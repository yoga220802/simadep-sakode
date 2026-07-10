# UI Screenshot Checklist - Prompt 14

Date: 2026-07-11

No screenshots were captured in Prompt 14 because this phase forbids runtime UI changes. Use this checklist during Prompt 15 and Prompt 17 visual verification.

## Project List

- Super admin/admin sees project list with status tabs, counts, year filter, create button, project cards, pagination.
- Department/project viewer sees scoped project cards without create/edit/delete controls.
- Empty filter result shows original empty state.
- Mobile width keeps filters and cards readable without overlapping text.

## Project Detail

- Manager/owner sees editable header title, status dropdown, tabs, and management affordances.
- Contributor/viewer sees read-only header and tabs allowed by capability.
- Detail tab shows description, schedule, and member avatar row.
- Schedule modal opens, validates, saves, and closes.
- Member modal opens, lists current members and eligible users, and hides restricted owner actions.

## Tasks

- Tasks tab shows filter controls and milestone groups.
- Milestone expand/collapse works.
- Task rows show status, category, assignees, due date, priority, and action column.
- Subtask indentation and expand/collapse match original hierarchy.
- Task create/edit/delete modal and confirmation states match original flow.

## Task Drawer

- Clicking task title opens right drawer.
- Drawer shows title, assignees, due date, priority, status, subtasks, description, attachments, comments, and activity.
- Nested subtask navigation and back action work.
- Assignee popover toggles assigned state and never lists non-project users.
- Category popover supports search, select, and clear.
- Comments and attachments are loaded only for the selected task.

## Categories And Report

- Categories tab shows table for all project viewers.
- Managers see add/edit/delete category modal and confirmation.
- Report tab is visible only to reporting-capable actors.
- Report charts and milestone estimation dropdown match original layout.
