# Legacy Database Model Report

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

Static source only. No database connection or Alembic migration was executed.

## Model Inventory

### `Project`

| Item | Value |
|---|---|
| Table | `project` |
| Model class | `Project` |
| Source path | `backend-management-project/app/db/models/project_model.py` |
| Primary key | `id Integer primary_key=True index=True autoincrement=True` |
| Columns | `id`, `title Text nullable=False`, `description Text nullable=True`, `start_date DateTime(timezone=True) nullable=True`, `end_date DateTime(timezone=True) nullable=True`, `status Enum(StatusProject, name="status_project") nullable=False default=StatusProject.TENDER`, `created_by Integer nullable=False`, `created_at`, `updated_at`, `deleted_at` |
| Enums | `StatusProject`: `tender`, `active`, `completed`, `cancel` |
| Relationships | `tasks`, `members`, `audit_logs`, `milestones`, `categories`, `notifications` |
| Cascade/delete | `ProjectMember`, `Category`, `Notification` relationships use cascade; child FKs commonly use `ondelete="CASCADE"`; `deleted_at` provides soft delete. |
| Timestamp behavior | `TimeStampMixin`: `created_at`, `updated_at`; Python UTC default plus `server_default=func.now()` for create. |
| Soft delete | `SoftDeleteMixin.deleted_at` nullable datetime. |
| PostgreSQL-specific usage | enum type names; repository queries may use SQLAlchemy aggregate/date expressions. |

### `ProjectMember`

| Item | Value |
|---|---|
| Table | `project_member` |
| Model class | `ProjectMember` |
| Source path | `backend-management-project/app/db/models/project_member_model.py` |
| Primary key | composite `project_id`, `user_id` |
| Columns | `project_id Integer ForeignKey(project.id, ondelete="CASCADE") primary_key=True`, `user_id Integer primary_key=True`, `role Enum(RoleProject, name="role_project")`, `created_at`, `updated_at` |
| Enums | `RoleProject`: `owner`, `contributor`, `viewer` |
| Relationships | `project` |
| Cascade/delete | Deleted when project is deleted through FK cascade. |
| Timestamp behavior | `TimeStampMixin`. |
| Soft delete | Not found in legacy source. |

### `UserRole`

| Item | Value |
|---|---|
| Table | `user_role` |
| Model class | `UserRole` |
| Source path | `backend-management-project/app/db/models/role_model.py` |
| Primary key | `user_id Integer primary_key=True unique=True` |
| Columns | `user_id`, `role Enum(Role, name="role") nullable=False default=Role.TEAM_MEMBER`, `created_at`, `updated_at` |
| Enums | `Role`: `admin`, `project_manager`, `team_member` |
| Relationships | Not found in legacy source. |
| Cascade/delete | Not found in legacy source. |
| Timestamp behavior | `TimeStampMixin`. |
| Soft delete | Not found in legacy source. |

### `Milestone`

| Item | Value |
|---|---|
| Table | `milestone` |
| Model class | `Milestone` |
| Source path | `backend-management-project/app/db/models/milestone_model.py` |
| Primary key | `id Integer primary_key=True unique=True index=True autoincrement=True` |
| Columns | `id`, `project_id Integer ForeignKey(project.id) nullable=False`, `title String(255) nullable=False`, `display_order Integer nullable=False`, `created_at`, `updated_at` |
| Relationships | `project`, `tasks` |
| Cascade/delete | `tasks` relationship uses `cascade="all, delete-orphan"`. No explicit FK `ondelete` on `project_id` found. |
| Timestamp behavior | `TimeStampMixin`. |
| Soft delete | Not found in legacy source. |
| Constraints/indexes | No unique `(project_id, display_order)` found in model source. |

### `Task` And `TaskAssignee`

| Item | Value |
|---|---|
| Table | `task` |
| Model class | `Task` |
| Source path | `backend-management-project/app/db/models/task_model.py` |
| Primary key | `id Integer primary_key=True index=True autoincrement=True` |
| Columns | `id`, `milestone_id Integer ForeignKey(milestone.id) nullable=False`, `name Text nullable=False`, `description Text nullable=True`, `status Enum(StatusTask, name="status_task") nullable=True`, `priority Enum(PriorityLevel, name="priority_level") nullable=True`, `display_order Integer nullable=False`, `due_date DateTime(timezone=True) nullable=True`, `start_date DateTime(timezone=True) nullable=True`, `estimated_duration Integer nullable=True`, `finish_duration Integer nullable=True`, `created_by Integer nullable=False`, `project_id Integer ForeignKey(project.id, ondelete="CASCADE") nullable=False`, `parent_id Integer ForeignKey(task.id, ondelete="CASCADE") nullable=True`, `category_id Integer ForeignKey(category.id, ondelete="SET NULL") nullable=True`, `completed_at DateTime(timezone=True) nullable=True`, `created_at`, `updated_at` |
| Enums | `StatusTask`: `pending`, `in_progress`, `completed`, `cancelled`; `PriorityLevel`: `low`, `medium`, `high`; `ResourceType`: `task`, `milestone` |
| Relationships | `project`, `parent`, `sub_tasks`, `assignees`, `comments`, `attachments`, `milestone`, `category`, `notifications` |
| Cascade/delete | `sub_tasks`, `assignees`, `comments`, `attachments`, `notifications` use cascade/delete orphan and/or FK cascade. |
| Timestamp behavior | `TimeStampMixin`. |
| Soft delete | Not found in legacy source. |
| Constraints/indexes | No optimistic version column found. |

| Item | Value |
|---|---|
| Table | `task_assignee` |
| Model class | `TaskAssignee` |
| Source path | `backend-management-project/app/db/models/task_model.py` |
| Primary key | composite `task_id`, `user_id` |
| Columns | `task_id Integer ForeignKey(task.id, ondelete="CASCADE") primary_key=True`, `user_id Integer primary_key=True` |
| Relationships | `task` |
| Delete behavior | Deleted with task through FK cascade. |

### `Category`

| Item | Value |
|---|---|
| Table | `category` |
| Model class | `Category` |
| Source path | `backend-management-project/app/db/models/category_model.py` |
| Primary key | `id Integer primary_key=True index=True autoincrement=True` |
| Columns | `id`, `project_id Integer ForeignKey(project.id) index=True`, `name String`, `description String nullable=True`, `created_at`, `updated_at` |
| Relationships | `tasks`, `project` |
| Cascade/delete | Project relationship has delete-orphan cascade from `Project.categories`; no model-level unique constraint on project/name found. |
| Timestamp behavior | `TimeStampMixin`. |

### `Comment`

| Item | Value |
|---|---|
| Table | `comment` |
| Model class | `Comment` |
| Source path | `backend-management-project/app/db/models/comment_model.py` |
| Primary key | `id Integer primary_key=True autoincrement=True unique=True` |
| Columns | `id`, `task_id Integer ForeignKey(task.id, ondelete="CASCADE") nullable=False`, `user_id Integer nullable=False`, `content Text nullable=False`, `created_at` |
| Relationships | `task`, `attachments` |
| Cascade/delete | Deleted with task; attachments relationship exists. |
| Timestamp behavior | `CreateStampMixin` only. |

### `Attachment`

| Item | Value |
|---|---|
| Table | `attachment` |
| Model class | `Attachment` |
| Source path | `backend-management-project/app/db/models/attachment_model.py` |
| Primary key | `id Integer primary_key=True index=True autoincrement=True` |
| Columns | `id`, `user_id Integer nullable=False`, `task_id Integer ForeignKey(task.id, ondelete="CASCADE") nullable=False`, `comment_id Integer ForeignKey(comment.id) nullable=True`, `file_name String nullable=False`, `file_path String nullable=False`, `file_size String nullable=False`, `mime_type String nullable=False`, `created_at` |
| Relationships | `task`, `comment` |
| Cascade/delete | Deleted with task; comment FK has no explicit `ondelete` in model source. |
| Timestamp behavior | `CreateStampMixin`. |
| Storage behavior | `file_path` stores URL/path or `"Error Uploading"` fallback. |

### `Notification`

| Item | Value |
|---|---|
| Table | `notification` |
| Model class | `Notification` |
| Source path | `backend-management-project/app/db/models/notification_model.py` |
| Primary key | `id Integer primary_key=True index=True autoincrement=True nullable=False` |
| Columns | `id`, `recipient_id Integer nullable=False`, `actor_id Integer nullable=False`, `project_id Integer ForeignKey(project.id, ondelete="CASCADE") nullable=True default=None`, `task_id Integer ForeignKey(task.id, ondelete="CASCADE") nullable=True default=None`, `type String(50) nullable=False`, `message String nullable=False`, `is_read Boolean default=False nullable=False`, `read_at DateTime(timezone=True) nullable=True default=None`, `created_at` |
| Enums | `NotificationType.PROJECT_DONE = "project_done"` only; handlers use string event types outside this enum. |
| Relationships | `project`, `task` |
| Cascade/delete | Project/task deletion cascades notification rows. |
| Timestamp behavior | `CreateStampMixin`. |

### `AuditLog`

| Item | Value |
|---|---|
| Table | `audit_log` |
| Model class | `AuditLog` |
| Source path | `backend-management-project/app/db/models/audit_model.py` |
| Primary key | `id Integer primary_key=True index=True autoincrement=True` |
| Columns | `id`, `performed_by Integer nullable=True default=None`, `project_id Integer ForeignKey(project.id, ondelete="CASCADE") nullable=True`, `task_id Integer nullable=True`, `action_type String(50) nullable=False`, `details JSONB nullable=True server_default="{}"`, `created_at` |
| Relationships | `project` |
| Cascade/delete | Project deletion cascades audit rows through FK. Task field is plain integer, not a foreign key in model source. |
| Timestamp behavior | `CreateStampMixin`. |
| PostgreSQL-specific usage | `JSONB` from `sqlalchemy.dialects.postgresql`. |

## Preliminary Target Mapping

| Legacy model.field | Legacy type | Target Drizzle table.field | Target MySQL type | Transformation | Risk |
|---|---|---|---|---|---|
| `Project.id` | `Integer` | `projects.id` | `varchar(36)` UUID | Generate UUID; store old value in `projects.legacy_id` nullable unique. | High: every FK must map through legacy ID. |
| `Project.status` | `Enum(tender, active, completed, cancel)` | `projects.status` | enum/varchar | Map `cancel` to target `cancelled` if target keeps that spelling. | Medium: source docs and UI currently mix labels. |
| `Project.created_by` | `Integer` | `projects.created_by_user_id` | `varchar(36)` | Resolve through user `legacy_id`. | High: external employee IDs are not Better Auth IDs. |
| `Project.deleted_at` | `DateTime(timezone=True)` | `projects.deleted_at` | `datetime(3)` | Preserve only if project archive/restore remains required. | Medium. |
| `ProjectMember.project_id` | `Integer` | `project_members.project_id` | `varchar(36)` | Map project legacy ID to UUID. | High. |
| `ProjectMember.user_id` | `Integer` | `project_members.user_id` | `varchar(36)` | Map user legacy ID to UUID. | High. |
| `ProjectMember.role` | `Enum(owner, contributor, viewer)` | `project_members.role` | enum/varchar | Owner -> owner, contributor -> contributor, viewer -> viewer; manager unresolved. | Medium: no legacy manager role. |
| `UserRole.user_id` | `Integer` | `user_profiles.legacy_id` / auth user relation | `int` + `varchar(36)` | Keep employee ID as legacy profile ID; role source moves to Better Auth/SIMADEP. | High. |
| `UserRole.role` | `Enum(admin, project_manager, team_member)` | `system_memberships.role` or Better Auth metadata | enum/varchar | Admin -> admin; team_member -> user; project_manager unresolved across global/project/dept roles. | High. |
| `Milestone.id` | `Integer` | `milestones.id` | `varchar(36)` | UUID plus `legacy_id`. | Medium. |
| `Milestone.display_order` | `Integer` | `milestones.display_order` | `int` | Preserve; add unique/index decision per project. | Medium: legacy lacks unique constraint. |
| `Task.id` | `Integer` | `tasks.id` | `varchar(36)` | UUID plus `legacy_id`. | High. |
| `Task.parent_id` | `Integer` self FK | `tasks.parent_task_id` | `varchar(36)` | Map to UUID, preserve hierarchy. | Medium. |
| `Task.status` | `Enum(pending, in_progress, completed, cancelled)` | `tasks.status` | enum/varchar | Preserve values if target agrees. | Low. |
| `Task.priority` | `Enum(low, medium, high)` | `tasks.priority` | enum/varchar | Preserve. | Low. |
| `Task.estimated_duration` | `Integer` | `tasks.estimated_duration_minutes` | `int` | Rename for unit clarity. | Low. |
| `Task.finish_duration` | `Integer` | `tasks.finish_duration_minutes` | `int` | Rename for unit clarity; recompute rules must match. | Medium. |
| `Task.category_id` | `Integer ondelete SET NULL` | `tasks.category_id` | `varchar(36) null` | Map category legacy ID to UUID. | Medium. |
| `TaskAssignee.task_id,user_id` | composite integer PK | `task_assignees.task_id,user_id` | `varchar(36)` composite PK | Map both IDs to UUIDs. | Medium. |
| `Category.id` | `Integer` | `task_categories.id` | `varchar(36)` | UUID plus `legacy_id`. | Medium. |
| `Comment.id` | `Integer` | `comments.id` | `varchar(36)` | UUID plus `legacy_id`. | Medium. |
| `Attachment.file_path` | `String` URL/path | `attachments.storage_key` / `attachments.url` | `varchar/text` | Split provider key from public URL where possible. | High: legacy sometimes stores `"Error Uploading"`. |
| `Attachment.file_size` | `String` | `attachments.size_bytes` | `bigint unsigned` | Parse numeric strings; links use `0`. | Medium. |
| `Attachment.mime_type` | `String` | `attachments.mime_type` | `varchar(255)` | Preserve; `hyperlink` is legacy pseudo-MIME. | Medium. |
| `Notification.id` | `Integer` | `notifications.id` | `varchar(36)` | UUID plus `legacy_id`. | Medium. |
| `Notification.is_read/read_at` | `Boolean/DateTime` | `notifications.read_at` | `datetime(3) null` | Target can derive read state from `read_at`. | Low. |
| `AuditLog.details` | `JSONB` | `audit_logs.details` | `json` | Convert PostgreSQL JSONB to MySQL JSON. | High: PostgreSQL-specific type. |
| `AuditLog.task_id` | `Integer` not FK | `audit_logs.task_id` | `varchar(36) null` | Map when resolvable; decide nullable orphan semantics. | Medium: no FK in legacy. |

## Database Portability Risks

- `AuditLog.details` uses PostgreSQL `JSONB`; target MySQL must use `json`.
- Runtime `Base.metadata.create_all()` exists in `app/db/base.py`; target migration workflow must use generated migrations instead.
- SQLAlchemy enum type names are PostgreSQL-oriented; target MySQL enum/varchar decision needs explicit migration plan.
- Several expected uniqueness/index constraints are not present in model source, including category name per project and milestone/task display order per parent/project.
- Legacy IDs are integers from the backend and external employee API. Target IDs are UUID strings with nullable unique `legacy_id`.
