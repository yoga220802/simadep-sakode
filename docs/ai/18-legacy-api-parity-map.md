# 18 — Legacy API Parity Map

This map allows Codex to rebuild backend behaviour even when the FastAPI repository is not connected. All legacy paths are under `/v1`. The target does not need to preserve these HTTP routes for internal web calls; use Server Actions/server queries unless the endpoint is needed externally.

| # | Method | Legacy path | Capability | Target boundary |
|---:|---|---|---|---|
| 1 | POST | `/auth/login` | external employee login | Better Auth route/client |
| 2 | GET | `/users/me` | current profile | server session query |
| 3 | GET | `/users/{user_id}` | user detail | identity server query |
| 4 | GET | `/users` | user directory | identity server query |
| 5 | PATCH | `/users/{user_id}/role` | global role update | server action |
| 6 | GET | `/projects` | project list/filter | server query |
| 7 | POST | `/projects` | create project | server action |
| 8 | GET | `/projects/{project_id}` | project detail | server query |
| 9 | PUT | `/projects/{project_id}` | update project | server action |
| 10 | DELETE | `/projects/{project_id}` | delete/archive project | server action |
| 11 | GET | `/projects/{project_id}/report` | project report | server query |
| 12 | POST | `/projects/{project_id}/members` | add project member | server action |
| 13 | DELETE | `/projects/{project_id}/members/{user_id}` | remove member | server action |
| 14 | PATCH | `/projects/{project_id}/members/{user_id}/role` | change member role | server action |
| 15 | GET | `/projects/{project_id}/milestone` | milestone/task tree | server query |
| 16 | POST | `/projects/{project_id}/milestone` | create milestone | server action |
| 17 | PUT | `/milestones/{milestone_id}` | update milestone | server action |
| 18 | DELETE | `/milestones/{milestone_id}` | delete milestone | server action |
| 19 | POST | `/milestones/{milestone_id}/tasks` | create task | server action |
| 20 | POST | `/tasks/{task_id}/subtasks` | create subtask | server action |
| 21 | GET | `/tasks/{task_id}` | task detail | server query |
| 22 | PUT | `/tasks/{task_id}` | update task | server action |
| 23 | DELETE | `/tasks/{task_id}` | delete task | server action |
| 24 | PATCH | `/tasks/{task_id}/status` | assignee status update | dedicated server action |
| 25 | GET | `/users/me/tasks` | current user tasks | server query |
| 26 | POST | `/tasks/{task_id}/assign` | assign user | server action |
| 27 | DELETE | `/tasks/{task_id}/unassign` | unassign user | server action |
| 28 | GET | `/projects/{project_id}/categories` | category list | server query |
| 29 | POST | `/projects/{project_id}/categories` | create category | server action |
| 30 | GET | `/categories/{category_id}` | category detail | server query/internal |
| 31 | PUT | `/categories/{category_id}` | update category | server action |
| 32 | DELETE | `/categories/{category_id}` | delete category | server action |
| 33 | POST | `/tasks/{task_id}/categories/{category_id}/assign` | assign category | server action |
| 34 | DELETE | `/tasks/{task_id}/categories/unassign` | unassign category | server action |
| 35 | POST | `/comments` | create comment | server action |
| 36 | GET | `/tasks/{task_id}/comments` | comments/activity | server query |
| 37 | DELETE | `/tasks/{task_id}/comments/{comment_id}` | delete comment | server action |
| 38 | POST | `/tasks/{task_id}/attachment/upload-file` | task file | upload route/action |
| 39 | POST | `/tasks/{task_id}/attachment/upload-link` | task link | server action |
| 40 | POST | `/comments/{comment_id}/attachment/upload-file` | comment file | upload route/action |
| 41 | POST | `/comments/{comment_id}/attachment/upload-link` | comment link | server action |
| 42 | DELETE | `/attachment/{attachment_id}` | delete attachment | server action |
| 43 | GET | `/users/me/notification` | notification inbox | server query |
| 44 | PATCH | `/notification/{notif_id}/read` | mark read | server action |
| 45 | GET | `/dashboard/admin` | global dashboard | server query |
| 46 | GET | `/dashboard/pm` | project manager dashboard | department/project query |
| 47 | GET | `/dashboard/user` | user dashboard | server query |

## Known legacy contract notes

- Frontend currently calls `/v1/auth/login`; backend route prefix confirms this target.
- Legacy project status uses `cancel`; new application standardizes `cancelled` and data migration maps it.
- Legacy user IDs come from an external employee service and are integers. New Better Auth IDs are strings; use explicit legacy ID mapping.
- Legacy category delete route function signature mentions `project_id` although the URL only contains `category_id`; new implementation must derive and authorize through category/project relation.
- Legacy auth token validation calls the employee API. This entire dependency is removed.
- Legacy dashboard has separate admin/PM/user routes. New code may use one actor-aware server query with typed result variants.

## Parity completion rule

For each row, record: target feature, implemented use case, UI caller migrated, authorization test, DB integration test, and legacy caller removed.
