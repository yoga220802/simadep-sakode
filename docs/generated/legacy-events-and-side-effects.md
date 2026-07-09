# Legacy Events And Side Effects

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

## Event Dispatch Model

| Source | Symbol | Behavior |
|---|---|---|
| `backend-management-project/app/db/uow/sqlalchemy.py` | `SQLAlchemyUnitOfWork.add_event`, `commit` | Services buffer events in UoW. `commit()` commits the SQLAlchemy session first, then calls `dispatch_pending_events`. |
| `backend-management-project/app/core/domain/bus.py` | `EventBus`, `subscribe`, `subscribe_bg`, `dispatch_pending_events` | Immediate handlers are awaited after commit. Background handlers are scheduled through FastAPI `BackgroundTasks` when available, else `asyncio.create_task`. Handler exceptions are caught and logged; committed DB transaction is not rolled back. |
| `backend-management-project/app/core/domain/subscribers.py` | `register_event_handlers` | Registers audit, notification, and attachment handlers. Called from `app/main.py` lifespan and also at module bottom. |

## Event Inventory

| Event | Payload highlights | Publisher/location | Subscribers/actions | Effect classification | Move to outbox? |
|---|---|---|---|---|---|
| `ProjectCreatedEvent` | `performed_by`, `project_id`, `project_title`, `user`, `admin_recipients`, metadata | `app/services/project_service.py::ProjectService.create_project` | audit row; notification to admins; realtime user signals | after commit; background notification; external realtime | Yes |
| `ProjectUpdatedEvent` | `performed_by`, `project_id`, `project_title` | `ProjectService._on_update_project` when title changes | audit row | after commit synchronous handler | Yes |
| `ProjectStatusChangedEvent` | `performed_by`, `project_id`, `before`, `after`, recipients, user | `ProjectService._on_update_project` when status changes | audit row; notifications; realtime | after commit; background notification; external realtime | Yes |
| `ProjectMemberAddedEvent` | actor/member/project/role/profile info | `ProjectService._on_member_added` | audit row; notification; realtime | after commit; background notification | Yes |
| `ProjectMemberUpdatedEvent` | before/after role and actor/member info | `ProjectService._on_member_role_update` | audit row; notification; realtime | after commit; background notification | Yes |
| `ProjectMemberRemovedEvent` | actor/member/project info | `ProjectService._on_remove_member` | audit row; notification; realtime | after commit; background notification | Yes |
| `TaskCreatedEvent` | task/project/actor info | `app/services/task_service.py` create methods | audit row | after commit | Yes |
| `TaskRenameEvent` | before/after title | `TaskService.update_task` | audit row | after commit | Yes |
| `TaskUpdatedEvent` | task update metadata | `TaskService.update_task` | audit row | after commit | Yes |
| `TaskDeletedEvent` | task delete metadata | event class exists in `app/core/domain/events/task.py` | audit handler registered; publisher not confirmed in delete service summary | after commit if published | Yes |
| `TaskStatusChangedEvent` | old/new status, task/project, actor | `TaskService.update_task`, `TaskService.change_status` | audit row | after commit | Yes |
| `SubTasksDetachedFromSectionEvent` | task/milestone context | event class exists and audit handler registered | publisher not confirmed from inspected route/service paths | after commit if published | Yes |
| `TaskAssignedAddedEvent` | task/assignee/project; source appears to pass `performed_by=task.id` in `TaskService.assign_user` | `TaskService.assign_user` | audit row; notification to assignee; realtime | after commit; background notification | Yes |
| `TaskAssignedRemovedEvent` | task/assignee/project; source appears to pass `performed_by=task.id` in `TaskService.unassign_user` | `TaskService.unassign_user` | audit row | after commit | Yes |
| `UserRoleAssignedEvent` | actor, target user, old/new role | `app/services/user_service.py::UserService.change_user_role` | audit row | after commit | Yes |
| `AttachmentUploadRequestedEvent` | attachment id, upload file bytes/path metadata | `AttachmentService.upload_attachment_with_event` | Cloudinary upload, DB finalize | after commit background; external network side effect | Yes |
| `AttachmentDeleteRequestedEvent` | `file_path` | `AttachmentService.delete_attachment` | Cloudinary delete | after commit background; external network side effect | Yes |

## Side Effects By Area

| Area | Source path | Action | Transaction classification | Error/retry behavior | Target recommendation |
|---|---|---|---|---|---|
| Audit logs | `app/core/domain/handlers/audit_handler.py::write_audit` | Opens a new session and inserts `AuditLog`. | after main commit, separate transaction | handler errors logged by event bus; no retry/outbox | Write audit in same business transaction where required or persist outbox item for reliable worker. |
| Notifications | `app/core/domain/handlers/notifications/*.py` | Creates `Notification` rows and sends realtime signal. | after main commit; often background | handler errors logged; committed action remains | Persist notification/outbox atomically with business mutation; worker sends signals. |
| Realtime | `app/core/realtime/notification.py`; `app/core/realtime/drivers.py` | Sends to SSE/WebSocket/Pusher drivers. | after commit/background external signal | best-effort; failures logged | Keep payload signal-only and retry via outbox where needed. |
| Cloudinary upload direct path | `app/services/attachment_service.py::upload_attachment` | Uploads bytes before creating DB attachment row; on upload exception creates row with `file_path="Error Uploading"`. | synchronous external side effect before DB insert | catches all exceptions and stores error placeholder | Target should create metadata transaction and move upload/delete to storage job with explicit failed status. |
| Cloudinary upload event path | `AttachmentUploadRequestedEvent`; `cloudinary_handler.py::handle_upload_attachment` | Uploads and finalizes attachment after commit. | after commit background external network | exception logged; no durable retry found | Use outbox/job retry. |
| Cloudinary delete | `AttachmentDeleteRequestedEvent`; `cloudinary_handler.py::handle_delete_attachment` | Deletes provider object by URL. | after commit background external network | exception logged; DB row may already be removed | Use outbox with idempotent delete and tombstone metadata. |
| External employee API | `app/client/pegawai_client.py`; `app/services/pegawai_service.py` | Login, token validation, current user, detail/list/bulk lookup. | synchronous external network during request | client exceptions propagate through auth/service flows | Replace with Better Auth/profile sync adapter. |
| Startup DB creation | `app/db/base.py::create_db_and_tables`; `app/main.py::lifespan` | Calls SQLAlchemy `Base.metadata.create_all`. | startup side effect | errors would fail startup | Do not preserve; target uses migrations. |

## Realtime Endpoints

| Endpoint | Source | Auth behavior | Side effect | Risk |
|---|---|---|---|---|
| `GET /sse` | `backend-management-project/app/sse.py::sse_endpoint` | `user_id` query; TODO says replace with auth dependency | registers SSE stream | user spoofing risk |
| `POST /sse/test` | `app/sse.py::test_sse_notification` | no source auth dependency found in route | sends test notification | test route should not ship |
| `WebSocket /ws` | `app/websocket.py::websocket_endpoint` | validates `access_token` query through external API | registers WebSocket connection and subscribes project channels | project subscribe lacks membership check |
| optional Pusher test | `app/core/realtime/drivers.py::test_pusher_notification` | test router only when enabled | triggers Pusher event | remove from target production |

## Effects That Should Move To SIMADEP Transactional Outbox

- All audit events that correspond to business mutations.
- All notification creation events.
- All realtime signal fan-out events.
- Cloudinary/storage upload and delete events.
- External synchronization events if employee/profile sync remains.

