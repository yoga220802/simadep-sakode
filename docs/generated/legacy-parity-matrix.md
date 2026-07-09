# Legacy Parity Matrix

Generated: 2026-07-09

Scope: Phase 0 baseline only. No architecture migration was implemented.

## Reference Availability

- FastAPI source directory was not present in this repository. Searched repository directories and Python/FastAPI markers; no `legacy/backend-fastapi`, `.py`, `pyproject.toml`, `requirements*.txt`, or `alembic.ini` files were found.
- Backend route reference used: `docs/ai/18-legacy-api-parity-map.md`.
- Business rule reference used: `docs/ai/17-PRD.md`, `docs/ai/07-domain-rules-and-permission-matrix.md`, `docs/ai/04-backend-technical-spec.md`, `docs/ai/05-database-schema-and-drizzle.md`, `docs/ai/06-auth-user-management-authorization.md`, `docs/ai/08-events-realtime-notifications.md`.
- "Legacy service/policy/event" columns below are inferred from the route capability and target documents because the original FastAPI service/policy/event files are unavailable.

## Current Pages

| Page | Current route file | Current purpose | Service calls |
|---|---|---|---|
| Root starter page | `src/app/page.tsx` | Default Next starter content; middleware redirects `/` to `/login`. | none |
| Login | `src/app/(auth)/login/page.tsx`, `src/components/LoginForm.tsx` | Username/password login through custom auth context. | `authService.login` |
| Main layout | `src/app/(main)/layout.tsx` | Client-side auth guard, dashboard frame, sidebar/header. | indirect `authService.revalidateSession`, `notificationService.initialize` through `AuthContext` |
| Dashboard | `src/app/(main)/dashboard/page.tsx`, `src/components/dashboard/DashboardContent.tsx` | Role-specific dashboard cards, charts, tables. | `dashboardService.getDashboardData` |
| Projects list | `src/app/(main)/projects/page.tsx` | Paginated project browsing, filters, create/edit/delete modal entry points. | `projectService.getProjects`, `projectService.deleteProject` |
| Project detail shell | `src/app/(main)/projects/[id]/page.tsx` | Loads project detail and opens detail tabs. | `projectService.getProjectById` |
| Project overview | `src/components/projects/detail/ProjectDetailView.tsx`, `ProjectHeader.tsx`, `EditScheduleModal.tsx` | Inline project metadata/status/schedule updates. | `projectService.updateProject` |
| Project members | `src/components/projects/detail/ManageMembersModal.tsx` | Search users, add/remove members, change project role. | `userService.getAllUsers`, `projectService.addMemberToProject`, `projectService.removeMemberFromProject`, `projectService.updateMemberRole` |
| Project work items | `src/components/projects/detail/ProjectTaskView.tsx`, `MilestoneGroup.tsx`, `TaskRow.tsx`, `TaskDetailSidebar.tsx` | Milestones, tasks, subtasks, status, assignments, categories, comments, attachments. | `taskService.*`, `categoryService.*`, `commentService.*`, `attachmentService.*`, `projectService.getProjectById` |
| Project categories | `src/components/projects/detail/ProjectCategoryView.tsx`, `CategoryFormModal.tsx` | Category list/create/update/delete. | `categoryService.getCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| Project report | `src/components/projects/report/ProjectReportView.tsx` | Project report charts and milestone context. | `reportService.getProjectReport`, `taskService.getMilestones` |
| My tasks | `src/app/(main)/tasks/page.tsx` | Current user's assigned task list. | `myTaskService.getMyTasks`, plus N+1 `projectService.getProjectById` |
| Users | `src/app/(main)/users/page.tsx` | User directory and global role update. | `userService.getUsers`, `userService.updateUserRole` |
| Notifications | `src/components/dashboard/NotificationDropdown.tsx`, `AuthContext.tsx` | Notification snapshot, mark all read, realtime subscription. | `notificationService.initialize`, `markAllAsRead`; `pusherService.connect/subscribe` |

## Service Method Matrix

| Frontend service method | Current caller(s) | Legacy route | Target boundary/use case | Legacy service/policy/event reference | Database entity |
|---|---|---|---|---|---|
| `authService.login` | `AuthContext`, `LoginForm` | `POST /v1/auth/login`, then `GET /v1/users/me` | Better Auth sign-in route/client + safe session query | External employee login is replaced by Better Auth (`docs/ai/06`, `docs/ai/18`). | Better Auth `user/session/account`, `user_profiles` |
| `authService.revalidateSession` | `AuthContext` | `GET /v1/users/me` | Server session query | Custom bearer token validation removed; session resolved server-side (`docs/ai/06`). | Better Auth `session`, `user_profiles` |
| `userService.getUsers` | users page | `GET /v1/users?page&per_page&search` | `listUsersForAdmin(actor, filters)` server query | User directory must be role/scope aware (`docs/ai/17`, `docs/ai/07`). | `user`, `user_profiles`, memberships |
| `userService.getAllUsers` | `ManageMembersModal` | `GET /v1/users?page=1&per_page=1000&search` | Internal user search for membership assignment | Target assignee/member search must not leak unauthorized users (`docs/ai/06`, `docs/ai/07`). | `user_profiles`, `project_members`, `department_members` |
| `userService.updateUserRole` | users page | `PATCH /v1/users/{user_id}/role?new_role=` | Admin user role server action | Last admin/self-demotion protections (`docs/ai/07`, `docs/ai/06`). Event `user.role-changed.v1` (`docs/ai/08`). | Better Auth user role/admin metadata, `audit_logs`, `outbox_events` |
| `projectService.getProjects` | projects page | `GET /v1/projects` | `listProjectsForActor(actor, filters)` server query | Scope/status filters required for non-privileged users (`docs/ai/07`, `docs/ai/09`). | `projects`, `project_members`, `departments` |
| `projectService.getProjectById` | project detail, project task view, my tasks | `GET /v1/projects/{project_id}` | `getProjectDetailForActor(actor, projectId)` server query | Cross-department/project visibility policy (`docs/ai/07`). | `projects`, `project_members`, `tasks` summary |
| `projectService.createProject` | `ProjectFormModal` | `POST /v1/projects` | `createProject` server action | Creator becomes owner; write authorization server-side (`docs/ai/07`, `docs/ai/04`). Event `project.created.v1`. | `projects`, `project_members`, `audit_logs`, `notifications`, `outbox_events` |
| `projectService.updateProject` | project form/header/detail/schedule | `PUT /v1/projects/{project_id}` | `updateProject` server action | Owner/manager/admin/dept policy; status rules centralized (`docs/ai/07`). Event `project.updated.v1` or `project.status-changed.v1`. | `projects`, `audit_logs`, `outbox_events` |
| `projectService.deleteProject` | projects page | `DELETE /v1/projects/{project_id}` | `archiveProject`/delete server action | Soft archive/delete by policy (`docs/ai/04`, `docs/ai/05`). | `projects.deleted_at`, `audit_logs`, `outbox_events` |
| `projectService.addMemberToProject` | `ManageMembersModal` | `POST /v1/projects/{project_id}/members` | `addProjectMember` server action | Duplicate membership forbidden; member notification (`docs/ai/07`, `docs/ai/08`). Event `project.member-added.v1`. | `project_members`, `notifications`, `audit_logs`, `outbox_events` |
| `projectService.removeMemberFromProject` | `ManageMembersModal` | `DELETE /v1/projects/{project_id}/members/{user_id}` | `removeProjectMember` server action | Owner cannot remove self/generic owner removal (`docs/ai/07`, `docs/ai/06`). Event `project.member-removed.v1`. | `project_members`, `notifications`, `audit_logs`, `outbox_events` |
| `projectService.updateMemberRole` | `ManageMembersModal` | `PATCH /v1/projects/{project_id}/members/{user_id}/role` | `changeProjectMemberRole` server action | Owner role cannot be changed generically (`docs/ai/07`, `docs/ai/06`). Event `project.member-role-changed.v1`. | `project_members`, `audit_logs`, `outbox_events` |
| `taskService.getMilestones` | project task/report views | `GET /v1/projects/{project_id}/milestone?sort_by&descending` | `listMilestonesWithTasksForActor` server query | Project visibility and task scope filters (`docs/ai/07`, `docs/ai/09`). | `milestones`, `tasks`, `task_assignees`, `task_categories` |
| `taskService.getTaskById` | `TaskDetailSidebar` | `GET /v1/tasks/{task_id}` | `getTaskDetailForActor` server query | Task visibility via project membership/assignment (`docs/ai/07`). | `tasks`, `task_assignees`, `comments`, `attachments`, `audit_logs` |
| `taskService.createMilestone` | `ProjectTaskView` | `POST /v1/projects/{project_id}/milestone` | `createMilestone` server action | Project leadership/admin required (`docs/ai/07`). | `milestones`, `audit_logs`, `outbox_events` |
| `taskService.updateMilestone` | `MilestoneGroup` | `PUT /v1/milestones/{milestone_id}` | `updateMilestone` server action | Project leadership/admin required (`docs/ai/07`). | `milestones`, `audit_logs`, `outbox_events` |
| `taskService.deleteMilestone` | `MilestoneGroup` | `DELETE /v1/milestones/{milestone_id}` | `deleteMilestone` server action | Project leadership/admin required; delete behavior explicit (`docs/ai/05`, `docs/ai/07`). | `milestones`, `tasks` cascade, `audit_logs` |
| `taskService.createTaskInMilestone` | `ProjectTaskView` | `POST /v1/milestones/{milestone_id}/tasks` | `createTask` server action | Project leadership permission; category/assignee same-project rules (`docs/ai/04`, `docs/ai/07`). Event `task.created.v1`. | `tasks`, `task_assignees`, `audit_logs`, `notifications`, `outbox_events` |
| `taskService.createSubtask` | `ProjectTaskView` | `POST /v1/tasks/{task_id}/subtasks` | `createSubtask` server action | Parent/milestone/project invariant (`docs/ai/04`, `docs/ai/05`). Event `task.created.v1`. | `tasks.parent_id`, `audit_logs`, `outbox_events` |
| `taskService.updateTask` | `TaskRow`, `TaskDetailSidebar` | `PUT /v1/tasks/{task_id}` | `updateTask` server action | Owner/manager/admin policy; optimistic version target (`docs/ai/05`, `docs/ai/07`). Event `task.updated.v1`. | `tasks`, `audit_logs`, `outbox_events` |
| `taskService.updateTaskStatus` | `TaskRow` | `PATCH /v1/tasks/{task_id}/status?status=` | Dedicated `changeTaskStatus` server action | Only assignees may use lightweight action; completed sets `completed_at` and duration (`docs/ai/07`). Event `task.status-changed.v1`. | `tasks.completed_at`, `finish_duration_minutes`, `audit_logs`, `notifications`, `outbox_events` |
| `taskService.deleteTask` | `ProjectTaskView` | `DELETE /v1/tasks/{task_id}` | `deleteTask` server action | Owner/manager/admin policy (`docs/ai/07`). | `tasks`, `task_assignees`, `comments`, `attachments`, `audit_logs` |
| `taskService.assignTask` | task views/sidebar | `POST /v1/tasks/{task_id}/assign` | `assignTask` server action | Assignee must already belong to project (`docs/ai/07`). Event `task.assignee-added.v1`. | `task_assignees`, `project_members`, `notifications`, `audit_logs`, `outbox_events` |
| `taskService.unassignTask` | task views/sidebar | `DELETE /v1/tasks/{task_id}/unassign?user_id=` | `unassignTask` server action | Project leadership/admin policy (`docs/ai/07`). Event `task.assignee-removed.v1`. | `task_assignees`, `audit_logs`, `outbox_events` |
| `myTaskService.getMyTasks` | tasks page | `GET /v1/users/me/tasks` | `listMyTasks(actor, filters)` server query | Current user assignment scope (`docs/ai/09`). | `tasks`, `task_assignees`, `projects` |
| `categoryService.getCategories` | project category/task views | `GET /v1/projects/{project_id}/categories` | `listCategoriesForProject` server query | Project visibility required (`docs/ai/07`). | `task_categories` |
| `categoryService.createCategory` | category form | `POST /v1/projects/{project_id}/categories` | `createCategory` server action | Project leadership/admin policy (`docs/ai/07`). | `task_categories`, `audit_logs` |
| `categoryService.updateCategory` | category form | `PUT /v1/categories/{category_id}` | `updateCategory` server action | Derive project through category relation (`docs/ai/18` note). | `task_categories`, `audit_logs` |
| `categoryService.deleteCategory` | category view | `DELETE /v1/categories/{category_id}?project_id=` | `deleteCategory` server action | Legacy signature mismatch; derive project server-side in target (`docs/ai/18`). | `task_categories`, `tasks.category_id SET NULL`, `audit_logs` |
| `categoryService.assignCategoryToTask` | task view | `POST /v1/tasks/{task_id}/categories/{category_id}/assign` | `assignTaskCategory` server action | Category must belong to same project (`docs/ai/04`, `docs/ai/05`). | `tasks.category_id`, `task_categories` |
| `categoryService.unassignCategoryFromTask` | task view | `DELETE /v1/tasks/{task_id}/categories/unassign` | `unassignTaskCategory` server action | Task update policy (`docs/ai/07`). | `tasks.category_id` |
| `commentService.getComments` | `TaskDetailSidebar` | `GET /v1/tasks/{task_id}/comments?include_audits=` | `listTaskTimeline` server query | Task visibility required; audit limited by scope (`docs/ai/07`). | `comments`, `audit_logs`, `attachments` |
| `commentService.createComment` | `TaskDetailSidebar` | `POST /v1/comments` | `createComment` server action | Comment requires task visibility (`docs/ai/04`). Event `comment.created.v1`. | `comments`, `notifications`, `audit_logs`, `outbox_events` |
| `commentService.deleteComment` | `TaskDetailSidebar` | `DELETE /v1/tasks/{task_id}/comments/{comment_id}` | `deleteComment` server action | Author or privileged actor (`docs/ai/04`, `docs/ai/07`). | `comments`, `audit_logs` |
| `attachmentService.uploadForTask` | `TaskDetailSidebar` | `POST /v1/tasks/{task_id}/attachment/upload-file` | Upload route/action | Attachment requires task visibility and storage metadata (`docs/ai/04`). Event `attachment.added.v1`. | `attachments`, storage object, `audit_logs`, `outbox_events` |
| `attachmentService.uploadLinkForTask` | `TaskDetailSidebar` | `POST /v1/tasks/{task_id}/attachment/upload-link` | `attachTaskLink` server action | Link attachment validation (`docs/ai/05`). Event `attachment.added.v1`. | `attachments` |
| `attachmentService.uploadForComment` | `TaskDetailSidebar` | `POST /v1/comments/{comment_id}/attachment/upload-file` | Upload route/action | Comment ownership/visibility validation (`docs/ai/04`). Event `attachment.added.v1`. | `attachments`, `comments`, storage object |
| `attachmentService.uploadLinkForComment` | `TaskDetailSidebar` | `POST /v1/comments/{comment_id}/attachment/upload-link` | `attachCommentLink` server action | Comment visibility validation (`docs/ai/04`). | `attachments`, `comments` |
| `attachmentService.deleteAttachment` | `TaskDetailSidebar` | `DELETE /v1/attachment/{attachment_id}` | `deleteAttachment` server action | Authorized deletion; storage delete consistency/retry (`docs/ai/04`, `docs/ai/16`). | `attachments`, storage object, `audit_logs` |
| `notificationService.fetchNotifications` | `AuthContext` init | `GET /v1/users/me/notification` | `getNotificationInbox` server query | Persistent inbox rows (`docs/ai/08`). | `notifications` |
| `notificationService.markAllAsRead` | notification dropdown | Repeated `PATCH /v1/notification/{notif_id}/read` | `markNotificationRead` / `markAllNotificationsRead` server action | Recipient-only mark read (`docs/ai/08`). | `notifications.read_at`, `is_read` |
| `dashboardService.getDashboardData(Admin)` | dashboard | `GET /v1/dashboard/admin` | Actor-aware dashboard server query | Global/admin dashboard scoped by role (`docs/ai/04`, `docs/ai/17`). | `users`, `projects`, `tasks` aggregates |
| `dashboardService.getDashboardData(Project Manager)` | dashboard | `GET /v1/dashboard/pm` | Actor-aware dashboard server query | Department/project scope (`docs/ai/04`, `docs/ai/17`). | `projects`, `tasks`, `project_members` |
| `dashboardService.getDashboardData(Team Member)` | dashboard | `GET /v1/dashboard/user` | Actor-aware dashboard server query | User task/project scope (`docs/ai/04`, `docs/ai/17`). | `tasks`, `task_assignees`, `projects` |
| `reportService.getProjectReport` | project report | `GET /v1/projects/{project_id}/report` | `getProjectReportForActor` server query | Project visibility and aggregate consistency (`docs/ai/04`, `docs/ai/09`). | `projects`, `tasks`, `task_assignees` |
| `pusherService.connect` authorizer | notification init | `POST /v1/auth/pusher` | `/api/realtime/auth` route handler | Private channel auth must verify subscription scope (`docs/ai/08`, `docs/ai/09`). | Session, memberships; no primary entity write |
| `pusherService.subscribe("user-{id}")` | notification init | Pusher channel subscription | `private-user-{userId}` signal channel | Payload is signal only; DB remains truth (`docs/ai/08`). | `outbox_events`, `notifications` |

## Important Business Rules With Source References

- Project creator becomes owner: `docs/ai/07-domain-rules-and-permission-matrix.md`, `docs/ai/04-backend-technical-spec.md`.
- Duplicate project membership is forbidden: `docs/ai/07-domain-rules-and-permission-matrix.md`, `docs/ai/05-database-schema-and-drizzle.md` (`project_members` unique `(project_id,user_id)`).
- Owner cannot remove themselves and owner role cannot be changed through generic member flows: `docs/ai/07-domain-rules-and-permission-matrix.md`, `docs/ai/06-auth-user-management-authorization.md`.
- Non-privileged project reads must be scoped by membership/department/status: `docs/ai/07-domain-rules-and-permission-matrix.md`.
- Task create/update/delete requires project leadership/admin policy; lightweight status change is assignee-only: `docs/ai/07-domain-rules-and-permission-matrix.md`.
- Assignee must already be a project member: `docs/ai/07-domain-rules-and-permission-matrix.md`.
- Completed task status sets `completed_at` and finish duration; reopening clears/recalculates by policy: `docs/ai/07-domain-rules-and-permission-matrix.md`, `docs/ai/05-database-schema-and-drizzle.md`.
- Last active privileged admin cannot be demoted/removed; users cannot change their own global role through normal UI: `docs/ai/06-auth-user-management-authorization.md`.
- Critical mutations should create audit/notification/outbox records in the same transaction: `docs/ai/04-backend-technical-spec.md`, `docs/ai/08-events-realtime-notifications.md`.
- Realtime/Pusher is an invalidation signal only and must not carry full sensitive entity data: `docs/ai/08-events-realtime-notifications.md`.

