# 05 — Database Schema and Drizzle Blueprint

## Conventions

- MySQL 8.
- App-generated string UUID IDs (`varchar(36)`).
- Better Auth user IDs are string and referenced consistently.
- `datetime(3)` UTC timestamps.
- `created_at`, `updated_at` naming.
- `legacy_id` nullable unique on migrated core entities.
- `version` integer on project/task for optimistic concurrency.
- Status/role stored as varchar and validated by Zod/application policies.
- Monetary values, if introduced, use integer smallest units or decimal—not float.

## Tables

### Better Auth managed

Generate using Better Auth/Drizzle integration and review the result. Expected logical tables:

- `user`
- `session`
- `account`
- `verification`

Admin plugin fields may include global role and ban metadata. Do not manually diverge from the adapter schema without documentation.

### `user_profiles`

- `user_id varchar(36) PK/FK user.id CASCADE`
- `employee_number varchar(64) nullable unique`
- `legacy_employee_id bigint nullable unique`
- `display_name varchar(150)`
- `position varchar(150) nullable`
- `work_unit varchar(150) nullable`
- `phone varchar(32) nullable`
- `avatar_url varchar(500) nullable`
- `employment_status varchar(32) default active`
- `joined_at datetime(3) nullable`
- `created_at`, `updated_at`

Indexes: employee number, display name/search support as needed.

### `departments`

- `id varchar(36) PK`
- `code varchar(32) unique`
- `name varchar(150)`
- `description text nullable`
- `status varchar(32) default active`
- `created_by varchar(36) FK user`
- `created_at`, `updated_at`, `archived_at nullable`

### `department_members`

- `id varchar(36) PK`
- `department_id FK CASCADE`
- `user_id FK CASCADE`
- `role varchar(32)`
- `status varchar(32) default active`
- `joined_at datetime(3)`
- `ended_at datetime(3) nullable`
- `created_at`, `updated_at`

Unique: active membership or `(department_id,user_id)` depending lifecycle design. Prefer one row with status history in audit for v1.

### `projects`

- `id varchar(36) PK`
- `legacy_id bigint nullable unique`
- `department_id FK RESTRICT`
- `title varchar(255)`
- `description text nullable`
- `status varchar(32)` values `tender|active|completed|cancelled`
- `start_date datetime(3) nullable`
- `end_date datetime(3) nullable`
- `created_by FK user`
- `version int default 1`
- `created_at`, `updated_at`, `deleted_at nullable`

Indexes:

- `(department_id,status)`
- `(department_id,start_date)`
- `(created_by)`
- `(deleted_at)`

### `project_members`

- `id varchar(36) PK`
- `project_id FK CASCADE`
- `user_id FK CASCADE`
- `role varchar(32)` values `owner|manager|contributor|viewer`
- `created_by FK user`
- `created_at`, `updated_at`

Unique `(project_id,user_id)`.
Index `(user_id,project_id)`.

### `milestones`

- `id varchar(36) PK`
- `legacy_id bigint nullable unique`
- `project_id FK CASCADE`
- `title varchar(255)`
- `display_order int`
- `created_at`, `updated_at`

Unique `(project_id,display_order)` unless reordering algorithm requires temporary duplicates; otherwise use transaction-safe reorder.

### `task_categories`

- `id varchar(36) PK`
- `legacy_id bigint nullable unique`
- `project_id FK CASCADE`
- `name varchar(100)`
- `description varchar(500) nullable`
- `created_at`, `updated_at`

Unique `(project_id,name)`.

### `tasks`

- `id varchar(36) PK`
- `legacy_id bigint nullable unique`
- `project_id FK CASCADE`
- `milestone_id FK CASCADE`
- `parent_id FK tasks.id CASCADE nullable`
- `category_id FK SET NULL nullable`
- `name varchar(255)`
- `description text nullable`
- `status varchar(32)` values `pending|in_progress|completed|cancelled`
- `priority varchar(16) nullable` values `low|medium|high`
- `display_order int`
- `start_date datetime(3) nullable`
- `due_date datetime(3) nullable`
- `estimated_duration_minutes int unsigned nullable`
- `finish_duration_minutes int unsigned nullable`
- `completed_at datetime(3) nullable`
- `created_by FK user`
- `version int default 1`
- `created_at`, `updated_at`

Indexes:

- `(project_id,status)`
- `(milestone_id,display_order)`
- `(parent_id)`
- `(due_date)`
- `(category_id)`

Invariant: milestone, parent, and category must belong to the same project.

### `task_assignees`

- `id varchar(36) PK`
- `task_id FK CASCADE`
- `user_id FK CASCADE`
- `assigned_by FK user`
- `assigned_at datetime(3)`

Unique `(task_id,user_id)`.
Index `(user_id,task_id)`.

### `comments`

- `id varchar(36) PK`
- `legacy_id bigint nullable unique`
- `task_id FK CASCADE`
- `user_id FK user`
- `content text`
- `created_at`, `updated_at nullable`
- `deleted_at nullable` if soft delete is required for audit; otherwise hard delete plus audit event.

### `attachments`

- `id varchar(36) PK`
- `legacy_id bigint nullable unique`
- `task_id FK CASCADE`
- `comment_id FK SET NULL nullable`
- `uploaded_by FK user`
- `kind varchar(16)` values `file|link`
- `file_name varchar(255)`
- `storage_key varchar(500) nullable`
- `external_url varchar(1000) nullable`
- `mime_type varchar(150) nullable`
- `size_bytes bigint unsigned nullable`
- `checksum_sha256 char(64) nullable`
- `created_at`

Check in application: file requires storage key; link requires external URL.

### `notifications`

- `id varchar(36) PK`
- `recipient_id FK user CASCADE`
- `actor_id FK user SET NULL nullable`
- `type varchar(80)`
- `title varchar(180)`
- `message varchar(1000)`
- `project_id FK SET NULL nullable`
- `task_id FK SET NULL nullable`
- `data json nullable`
- `is_read boolean default false`
- `read_at datetime(3) nullable`
- `created_at`

Indexes `(recipient_id,is_read,created_at)` and `(created_at)`.

### `audit_logs`

- `id varchar(36) PK`
- `correlation_id varchar(64)`
- `performed_by FK user SET NULL nullable`
- `department_id nullable`
- `project_id nullable`
- `task_id nullable`
- `resource_type varchar(64)`
- `resource_id varchar(36) nullable`
- `action_type varchar(80)`
- `before_data json nullable`
- `after_data json nullable`
- `details json nullable`
- `created_at`

Append only. No update/delete from normal application flow.

### `outbox_events`

- `id varchar(36) PK`
- `event_type varchar(100)`
- `aggregate_type varchar(64)`
- `aggregate_id varchar(36)`
- `payload json`
- `status varchar(20)` values `pending|processing|delivered|failed|dead`
- `attempt_count int default 0`
- `available_at datetime(3)`
- `processed_at datetime(3) nullable`
- `last_error varchar(1000) nullable`
- `created_at`, `updated_at`

Indexes `(status,available_at,created_at)` and `(aggregate_type,aggregate_id)`.

### `device_tokens`

- `id varchar(36) PK`
- `user_id FK CASCADE`
- `provider varchar(20)` currently `fcm`
- `token varchar(500) unique`
- `device_name varchar(150) nullable`
- `last_seen_at datetime(3)`
- `revoked_at datetime(3) nullable`
- `created_at`, `updated_at`

## Drizzle file ownership

```text
src/infrastructure/db/schema/
├── auth.schema.ts
├── identity.schema.ts
├── departments.schema.ts
├── projects.schema.ts
├── work-items.schema.ts
├── collaboration.schema.ts
├── notifications.schema.ts
├── audit.schema.ts
├── outbox.schema.ts
├── relations.ts
└── index.ts
```

## Scripts

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx scripts/db/migrate.ts",
  "db:seed": "tsx scripts/db/seed.ts",
  "db:studio": "drizzle-kit studio",
  "db:check": "drizzle-kit check"
}
```

Migration generation must not need a running DB. Migration application and seed require `DATABASE_URL`.
