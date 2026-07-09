# FastAPI Source Inventory

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

This inventory is based on static source inspection only. The FastAPI server was not started, no backend dependency install was performed, no database migration was run, and no external service was contacted.

## Application Entry Points

| Path | Purpose | Important symbols | Dependencies | SIMADEP domain | Migration disposition |
|---|---|---|---|---|---|
| `backend-management-project/app/main.py` | FastAPI application factory and lifecycle. Includes API v1 router, SSE, WebSocket, optional Pusher test router, CORS, static mount, exception handlers. | `lifespan`, `get_app`, `app` | `create_db_and_tables`, `load_all_models`, `register_event_handlers`, `aiohttp_client`, `api.router`, `sse_router`, `websocket_router`, `pusher_test_router` | platform/runtime, realtime | Replace. Preserve lifecycle concepts, but target Next.js must not call `create_all` on startup. |
| `backend-management-project/app/api/api.py` | API router composition. Prefixes all API route modules with `settings.version_url` (`/v1`). | `router` | route modules under `app/api/routes/*` | API boundary | Replace with Next.js route handlers/server actions by feature. |
| `backend-management-project/app/db/base.py` | Async SQLAlchemy engine/session and startup table creation. | `engine`, `async_session_maker`, `Base`, `create_db_and_tables`, `get_db` | `settings.db_url`, `NullPool`, SQLAlchemy | database | Replace. Target uses Drizzle migrations; do not preserve runtime `metadata.create_all`. |
| `backend-management-project/app/db/uow/sqlalchemy.py` | Unit of work, lazy repository access, event buffering, commit boundary. | `SQLAlchemyUnitOfWork`, `commit`, `rollback`, `add_event` | repository classes, `dispatch_pending_events` | application transaction | Preserve conceptually; replace with transactional use cases plus outbox. |

## Router Files And Prefixes

All route files below are included by `backend-management-project/app/api/api.py` under `/v1`.

| Path | Prefix | Purpose | Important classes/functions | Dependencies | Domain | Disposition |
|---|---:|---|---|---|---|---|
| `backend-management-project/app/api/routes/auth_route.py` | `/auth` | Login against external employee service. | `_Auth.login` | `OAuth2PasswordRequestForm`, `AuthHandler`, `UserService`, UoW | authentication | Replace with Better Auth sign-in. Preserve role bootstrap concept only if still needed. |
| `backend-management-project/app/api/routes/user_route.py` | `/users` | Current user, user detail/list, global role update. | `_User.me`, `_User.get_user_info`, `_User.list_users`, `_User.change_role` | `get_current_user`, `permission_required`, `get_user_admin`, `UserService` | users, global roles | Replace with SIMADEP user management and Better Auth admin/session APIs. |
| `backend-management-project/app/api/routes/project_route.py` | `/projects` | Project list/detail/create/update/delete/report. | `_Project.*` | `get_current_user`, `get_user_pm`, `permission_required`, `ProjectService` | projects, reports | Preserve business rules; rewrite as feature use cases. |
| `backend-management-project/app/api/routes/project_member_route.py` | `/projects` | Project membership add/remove/role change. | `_Project.add_member`, `_Project.remove_member`, `_Project.change_role_project_member` | `permission_required`, `UserService`, `ProjectService` | project members | Preserve policy intent; map roles to target model. |
| `backend-management-project/app/api/routes/milestone_route.py` | mixed | Project milestone list/create and milestone update/delete. | `_Milestone.*` | `get_current_user`, `MilestoneService` | milestones | Preserve rules; rewrite in work-items feature. |
| `backend-management-project/app/api/routes/task_route.py` | mixed | Task/subtask CRUD, detail, status, my tasks. | `_Task.*` | `get_current_user`, `get_user_pm`, `TaskService` | tasks, subtasks, assignments | Preserve exact rules where valid; fix documented gaps. |
| `backend-management-project/app/api/routes/assignee_task_route.py` | `/tasks` | Assign and unassign task users. | `_Task.assign_task`, `_Task.unassign_task` | `get_current_user`, `UserService`, `TaskService` | assignments | Preserve; add missing same-project/member validation in target. |
| `backend-management-project/app/api/routes/category_route.py` | mixed | Category CRUD and task category assignment. | `_Category.*` | `get_current_user`, `permission_required`, `CategoryService` | categories | Preserve same-project assignment rule; fix route signature mismatch. |
| `backend-management-project/app/api/routes/comment_route.py` | mixed | Comment create/list/delete with audit timeline. | `_Comment.*` | `get_current_user`, `CommentService` | comments, audit logs | Preserve comment/audit timeline concept. |
| `backend-management-project/app/api/routes/attachment_route.py` | mixed | File/link attachments for tasks/comments and delete. | `_Attachment.*` | `get_current_user`, `AttachmentService`, `UploadFile` | attachments, storage | Replace storage adapter and consistency model. |
| `backend-management-project/app/api/routes/notification_route.py` | mixed | Notification inbox and mark read. | `_Notification.*` | `get_current_user`, `NotificationService` | notifications | Preserve inbox model; rewrite recipient checks. |
| `backend-management-project/app/api/routes/dashboard_route.py` | `/dashboard` | Role-specific dashboards. | `_Dashboard.admin_dashboard`, `_Dashboard.pm_dashboard`, `_Dashboard.user_dashboard` | `get_user_admin`, `get_user_pm`, `get_user_member`, `DashboardService` | dashboards | Preserve aggregate intent; rewrite scoped queries. |

Additional realtime/test endpoints not included under `/v1`:

| Path | Prefix/path | Purpose | Important symbols | Disposition |
|---|---|---|---|---|
| `backend-management-project/app/sse.py` | `/sse` | SSE connect/info/test. | `sse_endpoint`, `sse_info`, `test_sse_notification`, `test_sse_ui` | Replace. Current connect route accepts `user_id` query and has TODO to replace with auth. |
| `backend-management-project/app/websocket.py` | `/ws` | WebSocket connect/info/test. | `websocket_endpoint`, `websocket_info`, `test_websocket_ui` | Replace. Token is query based; project subscription lacks membership check. |
| `backend-management-project/app/core/realtime/drivers.py` | configured test path or `/test/pusher/user/{user_id}` | Optional Pusher test route. | `pusher_test_router`, `test_pusher_notification` | Remove from production target. |

## Dependencies, Authentication, And Authorization

| Path | Purpose | Important classes/functions | Related files | Domain | Disposition |
|---|---|---|---|---|---|
| `backend-management-project/app/api/dependencies/authentication.py` | External bearer-token login/validation. | `AuthHandler.login`, `AuthHandler.validate_token`, `oauth2_scheme` | `PegawaiService`, `OAuth2PasswordBearer(tokenUrl="/v1/auth/login")` | auth | Replace with Better Auth. |
| `backend-management-project/app/api/dependencies/user.py` | Current user resolution and role dependencies. | `get_current_user`, `get_user_admin`, `get_user_pm`, `get_user_member`, `permission_required` | `AuthHandler`, `UserService`, `PegawaiService`, `Role` | authz/users | Preserve checks as policy evidence; rewrite as server-side contextual policies. |
| `backend-management-project/app/api/dependencies/uow.py` | Request-scoped UoW provider with background tasks. | `get_uow` | `SQLAlchemyUnitOfWork`, `BackgroundTasks` | transactions/events | Replace with per-use-case transaction/outbox handling. |
| `backend-management-project/app/core/policies/user_role.py` | Global role mapping and demotion rules. | `EMPLOYEE_TO_APP_ROLE`, `ensure_admin_not_change_own_role`, `ensure_not_demote_last_admin` | `Role`, exceptions | users/global roles | Preserve conceptually. |
| `backend-management-project/app/core/policies/project_member.py` | Project membership role mutation rules. | `ensure_can_assign_member_role`, `ensure_actor_can_remove_member`, `ensure_can_change_member_role` | `Role`, `RoleProject`, exceptions | project members | Preserve with target role mapping review. |
| `backend-management-project/app/core/policies/query_policies.py` | Project list filter policy. | `validate_status_by_role`, `normalize_year_range` | `StatusProject`, `Role` | projects | Preserve status/year constraints if product still wants them. |
| `backend-management-project/app/core/policies/task.py` | Task assignee/status helper policies. | `ensure_only_assignee_can_change_status`, `ensure_assignee_is_project_member`, `ALLOWED_TASK_STATUS_TRANSITIONS` | `StatusTask`, `RoleProject` | tasks | Preserve assignee-only status rule. Transition map is not enforced in current source. |

## Schemas

| Path | Purpose | Important symbols | Domain | Disposition |
|---|---|---|---|---|
| `backend-management-project/app/schemas/auth.py` | Auth token response. | `AuthToken` | auth | Replace with Better Auth session response. |
| `backend-management-project/app/schemas/user.py` | User/profile DTOs and pagination. | `UserBase`, `User`, `UserDetail`, `UserPaginationSchema` | users | Preserve fields as legacy profile mapping; target IDs become UUID with `legacy_id`. |
| `backend-management-project/app/schemas/project.py` | Project CRUD/detail/report DTOs. | `ProjectCreate`, `ProjectUpdate`, `ProjectRead`, `ProjectDetail`, `ProjectListPage`, `ProjectReport` | projects/reports | Preserve contract concepts; target schemas use Zod. |
| `backend-management-project/app/schemas/project_member.py` | Project member role update payload. | `ProjectMemberRoleUpdate` | members | Preserve with target role mapping. |
| `backend-management-project/app/schemas/milestone.py` | Milestone CRUD/detail DTOs. | `MilestoneCreate`, `MilestoneUpdate`, `MilestoneRead`, `MilestoneDetail` | milestones | Preserve. |
| `backend-management-project/app/schemas/task.py` | Task/subtask/my task DTOs. | `TaskCreate`, `TaskUpdate`, `TaskRead`, `TaskDetail`, `MyTaskRead` | tasks | Preserve with target status/priority review. |
| `backend-management-project/app/schemas/category.py` | Category DTOs. | `CategoryCreate`, `CategoryUpdate`, `CategoryRead` | categories | Preserve. |
| `backend-management-project/app/schemas/comment.py` | Comment and timeline DTOs. | `CommentCreate`, `CommentRead`, `CommentDetail`, `CommentWithCommentRead`, `CommentWithAuditRead` | comments/audit | Preserve timeline concept. |
| `backend-management-project/app/schemas/attachment.py` | Attachment DTOs. | `AttachmentRead`, `AttachmentLinkCreate` | attachments | Replace storage details with target adapter DTOs. |
| `backend-management-project/app/schemas/notification.py` | Notification DTOs. | `NotificationRead` | notifications | Preserve. |
| `backend-management-project/app/schemas/dashboard.py` | Dashboard response DTOs. | `AdminDashboardResponse`, `PMDashboardResponse`, `UserDashboardResponse` | dashboard | Preserve aggregate intent. |
| `backend-management-project/app/schemas/audit.py` | Audit timeline DTOs. | `TaskAuditSchema`, task audit detail schemas | audit/comments | Preserve. |

## Services

| Path | Important class | Purpose | Dependencies | Domain | Disposition |
|---|---|---|---|---|---|
| `backend-management-project/app/services/user_service.py` | `UserService` | Bootstrap/list/change local user roles using external employee data. | `PegawaiService`, `user_repository`, user role policies, `UserRoleAssignedEvent` | users | Replace with Better Auth + SIMADEP profile/membership use cases. |
| `backend-management-project/app/services/pegawai_service.py` | `PegawaiService` | External employee API facade and payload mapping. | `PegawaiApiClient`, `PegawaiAiohttpClient` | auth/profile source | Replace or wrap only if target still synchronizes employee source. |
| `backend-management-project/app/services/project_service.py` | `ProjectService` | Project CRUD, listing, member mutations, report. | project/task/user repositories, policies, events, `PegawaiService` | projects/members/reports | Preserve business rules; rewrite as vertical feature. |
| `backend-management-project/app/services/milestone_service.py` | `MilestoneService` | Milestone CRUD/list with project membership checks. | milestone/project repositories | milestones | Preserve. |
| `backend-management-project/app/services/task_service.py` | `TaskService` | Task/subtask CRUD, status changes, assignments, my tasks. | task/project/milestone repos, task policies, events, `PegawaiService` | tasks | Preserve proven rules; fix gaps. |
| `backend-management-project/app/services/category_service.py` | `CategoryService` | Category CRUD and task-category assignment. | category/project/task repos | categories | Preserve same-project check; fix admin route/service mismatch. |
| `backend-management-project/app/services/comment_service.py` | `CommentService` | Comments and audit timeline. | comment/task/audit repos, `PegawaiService` | comments/audit | Preserve. |
| `backend-management-project/app/services/attachment_service.py` | `AttachmentService` | File/link attachment validation, Cloudinary calls, delete event. | attachment/task/comment repos, `upload_bytes`, attachment events | attachments/storage | Replace storage side effects with transactional outbox adapter. |
| `backend-management-project/app/services/notification_service.py` | `NotificationService` | Notification listing and mark-read. | notification repo | notifications | Preserve recipient-only behavior. |
| `backend-management-project/app/services/dashboard_service.py` | `DashboardService` | Role-specific dashboard aggregates. | dashboard repo, `PegawaiService` | dashboard | Preserve aggregate concepts. |

## Repositories

| Path | Important class | Purpose | Domain | Disposition |
|---|---|---|---|---|
| `backend-management-project/app/repositories/generic.py` | `GenericRepository` | Generic SQLAlchemy CRUD helpers. | persistence | Replace with Drizzle repository/query functions as needed. |
| `backend-management-project/app/repositories/user_repository.py` | `SQLAlchemyUserRoleRepository` | Local role table CRUD/count/admin IDs. | users | Preserve rules, replace implementation. |
| `backend-management-project/app/repositories/project_repository.py` | `SQLAlchemyProjectRepository` | Project CRUD, membership, project pagination, reporting helpers. | projects | Preserve query behavior after policy review. |
| `backend-management-project/app/repositories/milestone_repository.py` | `SQLAlchemyMilestoneRepository` | Milestone CRUD/list/order. | milestones | Preserve. |
| `backend-management-project/app/repositories/task_repository.py` | `SQLAlchemyTaskRepository` | Task CRUD, scoped lookup, assignment, report queries. | tasks | Preserve with MySQL-portable query review. |
| `backend-management-project/app/repositories/category_repository.py` | `SQLAlchemyCategoryRepository` | Category CRUD and task category assign/unassign. | categories | Preserve. |
| `backend-management-project/app/repositories/comment_repository.py` | `SQLAlchemyCommentRepository` | Comment CRUD/list for task. | comments | Preserve. |
| `backend-management-project/app/repositories/attachment_repository.py` | `SQLAlchemyAttachmentRepository` | Attachment CRUD/finalize upload. | attachments | Preserve metadata only; storage through adapter/outbox. |
| `backend-management-project/app/repositories/notification_repository.py` | `SQLAlchemyNotificationRepository` | Notification list/read filtering. | notifications | Preserve. |
| `backend-management-project/app/repositories/audit_repository.py` | `SQLAlchemyAuditRepository` | Audit timeline queries. | audit | Preserve. |
| `backend-management-project/app/repositories/dashboard_repository.py` | `SQLAlchemyDashboardRepository` | Dashboard aggregate queries. | dashboard | Preserve after MySQL portability review. |

## SQLAlchemy Models

| Path | Model classes | Purpose | Domain | Disposition |
|---|---|---|---|---|
| `backend-management-project/app/db/models/project_model.py` | `Project`, `StatusProject` | Project table with soft delete and status enum. | projects | Preserve concept; target table uses UUID and MySQL enum/varchar decision. |
| `backend-management-project/app/db/models/project_member_model.py` | `ProjectMember`, `RoleProject` | Composite project membership table. | members | Preserve; add target `manager` role mapping. |
| `backend-management-project/app/db/models/role_model.py` | `UserRole`, `Role` | Local global role cache. | users/global roles | Replace with Better Auth role + SIMADEP profile model. |
| `backend-management-project/app/db/models/task_model.py` | `Task`, `TaskAssignee`, `StatusTask`, `PriorityLevel`, `ResourceType` | Tasks/subtasks/assignees. | work items | Preserve with UUID, optimistic version, MySQL compatible fields. |
| `backend-management-project/app/db/models/milestone_model.py` | `Milestone` | Project milestones. | milestones | Preserve. |
| `backend-management-project/app/db/models/category_model.py` | `Category` | Per-project task categories. | categories | Preserve with unique constraint decision. |
| `backend-management-project/app/db/models/comment_model.py` | `Comment` | Task comments. | comments | Preserve. |
| `backend-management-project/app/db/models/attachment_model.py` | `Attachment` | Task/comment attachments and links. | attachments | Preserve metadata concept; redesign storage consistency. |
| `backend-management-project/app/db/models/notification_model.py` | `Notification`, `NotificationType` | Notification inbox rows. | notifications | Preserve; expand typed event names in target. |
| `backend-management-project/app/db/models/audit_model.py` | `AuditLog` | Audit records using PostgreSQL JSONB. | audit | Preserve; convert JSONB to MySQL JSON. |
| `backend-management-project/app/db/models/_mixin.py` | timestamp/soft delete mixins | Timestamp and soft delete fields. | shared persistence | Preserve conceptually with UTC `datetime(3)`. |

## Domain Events, Subscribers, And Side Effects

| Path | Purpose | Important symbols | Domain | Disposition |
|---|---|---|---|---|
| `backend-management-project/app/core/domain/event.py` | Base event definitions and event enum. | `EventType`, `DomainEvent` | events | Preserve event taxonomy after target review. |
| `backend-management-project/app/core/domain/events/*.py` | Concrete domain event classes. | 17 event dataclasses across project, project_member, task, assignee, user, attachment | events | Preserve relevant event names; route through outbox. |
| `backend-management-project/app/core/domain/bus.py` | In-process event bus. | `EventBus`, `subscribe`, `subscribe_bg`, `dispatch_pending_events` | events | Replace with transactional outbox + workers. |
| `backend-management-project/app/core/domain/subscribers.py` | Registers audit, notification, and Cloudinary handlers. | `register_event_handlers` | events | Replace with explicit target subscriber registration. |
| `backend-management-project/app/core/domain/handlers/audit_handler.py` | Writes audit rows using independent session. | `write_audit` | audit | Move audit write into same transaction/outbox as business action where required. |
| `backend-management-project/app/core/domain/handlers/audits/*.py` | Audit subscribers for project, member, task, assignee, user. | `handle_*` functions | audit | Preserve event-to-audit mapping. |
| `backend-management-project/app/core/domain/handlers/notifications/*.py` | Notification subscribers and realtime sends. | `handle_*` functions | notifications/realtime | Preserve concept; move to outbox. |
| `backend-management-project/app/core/domain/handlers/attachments/cloudinary_handler.py` | Cloudinary upload/delete subscribers. | `handle_upload_attachment`, `handle_delete_attachment` | storage | Replace with storage adapter + retryable job/outbox. |

## Realtime, Storage, Reporting, Config, Tests

| Path | Purpose | Important symbols | Domain | Disposition |
|---|---|---|---|---|
| `backend-management-project/app/core/realtime/notification.py` | Driver fan-out helper. | `send_to_user`, `send_to_users`, `broadcast_project` | realtime | Replace with signal-only target realtime. |
| `backend-management-project/app/core/realtime/drivers.py` | SSE/WebSocket/Pusher drivers and optional Pusher test router. | `SSEDriver`, `WebSocketDriver`, `PusherDriver`, `RealtimeManager` | realtime | Replace; no test router in production. |
| `backend-management-project/app/core/realtime/sse.py` | SSE connection manager. | `SSEConnectionManager` | realtime | Replace or remove. |
| `backend-management-project/app/core/realtime/websocket.py` | WebSocket connection manager. | `WebSocketManager` | realtime | Replace or remove. |
| `backend-management-project/app/utils/cloudinary.py` | Cloudinary upload/delete helpers. | `init_cloudinary`, `upload_bytes`, `destroy_by_url` | storage | Replace with storage port/adapter. |
| `backend-management-project/app/core/config/settings.py` | Main settings and environment contract. | `Settings`, `get_settings` | config | Replace with Next env validation. |
| `backend-management-project/app/core/config/api_pegawai.py` | External employee API URL construction. | `PegawaiApiUrls` | external profile source | Replace or adapterize. |
| `backend-management-project/alembic/versions/*.py` | 25 Alembic migration files found. | revision scripts | database history | Read-only reference only; do not port blindly. |
| `backend-management-project/pytest.ini` | Test config. | pytest markers | tests | No test source files found during inventory. |
| `backend-management-project/.env.example` | Backend env sample. | DB, API pegawai, Cloudinary, Pusher values | config | Do not reuse secrets; note naming mismatch risk. |
| `backend-management-project/requirements.txt`, `pyproject.toml`, `uv.lock` | Backend dependency manifests. | FastAPI, SQLAlchemy, asyncpg, Alembic, Pusher, Cloudinary | tooling | Read-only reference. |

## Counts

- Python source files inspected: 169.
- API v1 route functions found: 47.
- Additional realtime/test endpoint functions found: 8.
- SQLAlchemy table model classes found: 10.
- Service files/classes found: 10.
- Repository files found: 11.
- Domain event classes found: 17.
- Alembic version files found: 25.
- Backend test files found: none besides `pytest.ini`.
