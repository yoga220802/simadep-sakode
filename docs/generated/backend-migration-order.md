# Recommended Backend Migration Order

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

The order below is vertical-slice oriented and based on source dependencies. It does not propose moving current frontend folders in this audit task.

## Slice 1: Authentication, User Profile, And Role Bootstrap

| Item | Source/target |
|---|---|
| Legacy router | `backend-management-project/app/api/routes/auth_route.py`, `app/api/routes/user_route.py` |
| Legacy service | `app/services/pegawai_service.py`, `app/services/user_service.py` |
| Legacy repository | `app/repositories/user_repository.py` |
| Legacy models | `app/db/models/role_model.py::UserRole` |
| Frontend consumers | `src/services/authService.ts`, `src/services/userService.ts`, `src/context/AuthContext.tsx`, login/users pages |
| Target feature folder | `src/features/auth`, `src/features/users` |
| Target server boundary | Better Auth route handler; user-management server actions/queries |
| Target entities | Better Auth tables, `user_profiles`, memberships/roles, `audit_logs`, `outbox_events` |
| Authorization policies | current session, admin-only role change, self-demotion/last-admin protection |
| Events/side effects | `UserRoleAssignedEvent` -> audit/outbox |
| Unit tests | login/session helpers, role mapping, self-demotion, last-admin |
| Integration tests | auth session creation, role mutation transaction, user profile lookup with fake repository |
| Migration risks | external employee ID mapping, global `project_manager` ambiguity, bearer-token removal |

## Slice 2: Project Read/List And Membership Visibility

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/project_route.py` list/detail |
| Legacy service | `app/services/project_service.py::list_projects`, `get_project_detail`, `summarize_user_projects` |
| Legacy repository | `app/repositories/project_repository.py`, `app/repositories/task_repository.py` |
| Legacy models | `Project`, `ProjectMember`, `Task` |
| Frontend consumers | `src/services/projectService.ts`, project list/detail, my-task enrichment |
| Target feature folder | `src/features/projects` |
| Target server boundary | server query for list/detail |
| Target entities | `projects`, `project_members`, `tasks`, departments when introduced |
| Authorization policies | actor project visibility, status filter restrictions, year range validation |
| Events/side effects | none for read |
| Unit tests | status filter policy, year range policy, scoped visibility |
| Integration tests | list/detail SQL scopes against local MySQL/service container |
| Migration risks | department model absent in legacy, status `cancel` mapping |

## Slice 3: Project Mutations And Project Members

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/project_route.py`, `app/api/routes/project_member_route.py` |
| Legacy service | `ProjectService.create_project`, `update_project`, `delete_project`, `assign_project_member`, `remove_project_member`, `update_member_role` |
| Legacy repository | `SQLAlchemyProjectRepository`, `SQLAlchemyUserRoleRepository` |
| Legacy models | `Project`, `ProjectMember`, `UserRole`, `AuditLog`, `Notification` |
| Frontend consumers | `projectService.createProject/updateProject/deleteProject/addMember/removeMember/updateMemberRole`, `ManageMembersModal` |
| Target feature folder | `src/features/projects` |
| Target server boundary | server actions for create/update/archive/member mutations |
| Target entities | `projects`, `project_members`, `audit_logs`, `notifications`, `outbox_events` |
| Authorization policies | creator owner, owner/admin override decision, duplicate member, cannot remove owner/self, cannot change owner/self role |
| Events/side effects | project/member audit, notifications, realtime signals |
| Unit tests | every policy branch and event emission |
| Integration tests | multi-write transaction and outbox rows |
| Migration risks | route/service mismatch for admin/PM; project `manager` target role missing in legacy |

## Slice 4: Milestones And Task Core

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/milestone_route.py`, `app/api/routes/task_route.py` |
| Legacy service | `MilestoneService`, `TaskService.create_task`, `create_subtask`, `get_detail_task`, `update_task`, `delete_task` |
| Legacy repository | `MilestoneRepository`, `TaskRepository`, `ProjectRepository` |
| Legacy models | `Milestone`, `Task`, `TaskAssignee`, `ProjectMember`, `Category` |
| Frontend consumers | `src/services/taskService.ts`, task view/sidebar/milestone components |
| Target feature folder | `src/features/work-items` |
| Target server boundary | server queries/actions for milestones/tasks/subtasks |
| Target entities | `milestones`, `tasks`, `task_assignees`, `task_categories`, `audit_logs`, `outbox_events` |
| Authorization policies | owner/admin/manager decisions, scoped task detail, parent/milestone/project invariant |
| Events/side effects | task create/update/rename/delete/status audit events |
| Unit tests | task lifecycle, subtask inheritance, duration calculation, category project check |
| Integration tests | cascade/delete behavior, optimistic version conflict |
| Migration risks | no legacy optimistic version, transition table not enforced, manual subtask delete behavior |

## Slice 5: Task Status And Assignments

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/task_route.py` status/my tasks; `app/api/routes/assignee_task_route.py` |
| Legacy service | `TaskService.change_status`, `assign_user`, `unassign_user`, `list_user_tasks` |
| Legacy repository | `TaskRepository`, `ProjectRepository` |
| Legacy models | `Task`, `TaskAssignee`, `ProjectMember`, `Notification`, `AuditLog` |
| Frontend consumers | `taskService.updateTaskStatus/assignTask/unassignTask`, `myTaskService.getMyTasks` |
| Target feature folder | `src/features/work-items`, `src/features/notifications` |
| Target server boundary | dedicated status and assignment server actions; my-tasks server query |
| Target entities | `tasks`, `task_assignees`, `project_members`, `notifications`, `audit_logs`, `outbox_events` |
| Authorization policies | assignee-only status, owner/admin assignment, target assignee must be project member |
| Events/side effects | `TaskStatusChangedEvent`, `TaskAssignedAddedEvent`, `TaskAssignedRemovedEvent` |
| Unit tests | status authorization, completion timestamp/duration, assignment membership gap fixed |
| Integration tests | assignment uniqueness, notification/outbox creation |
| Migration risks | legacy assignment event `performed_by` appears wrong; membership policy helper unused |

## Slice 6: Categories

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/category_route.py` |
| Legacy service | `CategoryService` |
| Legacy repository | `CategoryRepository`, `TaskRepository`, `ProjectRepository` |
| Legacy models | `Category`, `Task`, `ProjectMember` |
| Frontend consumers | `src/services/categoryService.ts`, category/task views |
| Target feature folder | `src/features/work-items` |
| Target server boundary | category queries/actions |
| Target entities | `task_categories`, `tasks`, `audit_logs` if target adds category audit |
| Authorization policies | member read, owner/admin decision for write, same-project task/category assignment |
| Events/side effects | Not found in legacy source |
| Unit tests | same-project assignment, admin/owner write decision |
| Integration tests | category delete sets task category null if target preserves behavior |
| Migration risks | route function signature mismatch for delete; admin bypass mismatch |

## Slice 7: Comments And Audit Timeline

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/comment_route.py` |
| Legacy service | `CommentService` |
| Legacy repository | `CommentRepository`, `AuditRepository`, `TaskRepository` |
| Legacy models | `Comment`, `AuditLog`, `Task`, `Attachment` |
| Frontend consumers | `src/services/commentService.ts`, `TaskDetailSidebar` |
| Target feature folder | `src/features/collaboration`, `src/features/audit` |
| Target server boundary | comment actions and task timeline query |
| Target entities | `comments`, `audit_logs`, `attachments`, `outbox_events` |
| Authorization policies | active project for comment create, member/admin list, author/admin/owner delete |
| Events/side effects | no comment event found; audit timeline reads audit events |
| Unit tests | inactive project block, membership list, delete permissions, audit mapping |
| Integration tests | timeline ordering with comments and audits |
| Migration risks | external profile enrichment for timeline users |

## Slice 8: Attachments And Storage

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/attachment_route.py` |
| Legacy service | `AttachmentService` |
| Legacy repository | `AttachmentRepository`, `TaskRepository`, `CommentRepository` |
| Legacy models | `Attachment`, `Task`, `Comment` |
| Frontend consumers | `src/services/attachmentService.ts`, sidebar attachment components |
| Target feature folder | `src/features/collaboration`, `src/infrastructure/storage` |
| Target server boundary | upload route handler and link/delete server actions |
| Target entities | `attachments`, `storage_objects` if added, `outbox_events` |
| Authorization policies | task member/admin, comment author, delete admin/project owner |
| Events/side effects | Cloudinary upload/delete events |
| Unit tests | MIME/size checks, policy branches, storage port outcomes |
| Integration tests | metadata transaction plus outbox; cleanup retry behavior |
| Migration risks | current direct upload consistency gap, public URL parsing, no orphan cleanup |

## Slice 9: Notifications And Realtime

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/notification_route.py`, `app/sse.py`, `app/websocket.py`, optional Pusher test router |
| Legacy service | `NotificationService`; realtime drivers |
| Legacy repository | `NotificationRepository` |
| Legacy models | `Notification` |
| Frontend consumers | `src/services/notificationService.ts`, `src/services/pusherService.ts`, notification dropdown/AuthContext |
| Target feature folder | `src/features/notifications`, `src/infrastructure/realtime` |
| Target server boundary | notification inbox query/actions, realtime auth route handler |
| Target entities | `notifications`, `outbox_events`, user/project memberships |
| Authorization policies | recipient-only inbox/read, private user/project channel auth |
| Events/side effects | notification creation, Pusher/SSE/WebSocket signal |
| Unit tests | recipient-only mark read, channel authorization |
| Integration tests | outbox worker idempotency, notification persistence |
| Migration risks | no legacy Pusher auth endpoint, SSE/WebSocket auth gaps |

## Slice 10: Dashboards And Reports

| Item | Source/target |
|---|---|
| Legacy router | `app/api/routes/dashboard_route.py`, `app/api/routes/project_route.py::get_project_report` |
| Legacy service | `DashboardService`, `ProjectService.get_project_report` |
| Legacy repository | `DashboardRepository`, `TaskRepository`, `ProjectRepository` |
| Legacy models | `Project`, `Task`, `TaskAssignee`, `ProjectMember` |
| Frontend consumers | `src/services/dashboardService.ts`, `src/services/reportService.ts` |
| Target feature folder | `src/features/dashboard`, `src/features/reports` |
| Target server boundary | role-aware dashboard/report queries |
| Target entities | project/task/member aggregates, departments if target scope applies |
| Authorization policies | admin/PM/member dashboard roles; report admin/owner or owner-decided scope |
| Events/side effects | none for reads |
| Unit tests | scoped aggregate policy and date-window rules |
| Integration tests | aggregate SQL correctness against fixtures |
| Migration risks | external user enrichment, owner-only report may conflict with target manager expectations |

