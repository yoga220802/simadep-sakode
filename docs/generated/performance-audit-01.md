# Performance Audit 01

Date: 2026-07-12

## Scope

Reviewed dashboard, projects, project detail, tasks, navigation, and notification
startup behavior for Vercel Hobby/serverless latency.

## Findings

- Sidebar navigation links were eligible for Next.js prefetch, causing RSC
  requests for `/tasks`, `/projects`, `/users`, and `/departments` while the
  user was still on the current page.
- The main app shell loaded navigation capabilities from the client after first
  render, adding one extra request on every protected page.
- Notification inbox loaded during header initialization, even when the
  dropdown was never opened.
- Dashboard role counts selected all active users and reduced them in memory.
- User-scope dashboard loaded visible project tasks and then filtered assigned
  task IDs in a second query.

## Changes

- Server-seeded the protected app shell with session display user and navigation
  capabilities.
- Cached navigation capabilities in the Next.js composition root for 60 seconds.
- Disabled sidebar `Link` prefetch for primary navigation and profile link.
- Kept notification realtime connection initialization, but delayed notification
  inbox fetch until the dropdown is opened.
- Changed dashboard role counts to SQL aggregate counts.
- Changed user-scope dashboard task loading to query assigned tasks directly.
- Added development-only query timing logs for dashboard, project list, and my
  tasks queries.
- Added index migration for common serverless query paths:
  - `department_members(department_id, status)`
  - `projects(deleted_at, updated_at)`
  - `projects(status, updated_at)`
  - `task_assignees(user_id, assigned_at)`
  - `tasks(project_id, due_date)`

## Remaining Work

- Project detail can still be heavy because task board, report, collaboration,
  and detail drawer interactions are feature-rich. Continue lazy loading any tab
  data that is not active.
- Vercel Hobby cold starts and remote MySQL latency will still be visible. Keep
  Vercel function region close to the Aiven MySQL region.
- Consider adding explicit pagination/windowing for dashboard project/task
  summaries once production data grows beyond seed-scale.
