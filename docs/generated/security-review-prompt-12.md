# Prompt 12 Security Review Report

Date: 2026-07-10

## Scope

This review covers the migrated SIMADEP Next.js full-stack runtime after legacy cleanup:

- server actions and API route authentication boundaries;
- department, project, work item, notification, upload, and realtime authorization;
- SQL query scoping, pagination limits, search input constraints, and N+1 risk;
- transaction rollback and optimistic conflict behavior;
- protected last-admin, last-department-head, and project-owner paths;
- audit/log handling for sensitive data;
- rate limiting plan for auth, upload, realtime auth, and cron/job endpoints.

## Findings

### Authentication And Authorization

- Feature server actions under `src/features/*/server/*actions.ts` all call `requireServerSession`.
- Internal API route handlers under `src/app/api/**/route.ts` all call `requireServerSession`, excluding the official Better Auth route delegated to `toNextJsHandler(auth)`.
- The outbox processing endpoint additionally requires `super_admin` or `admin`.
- Notification routes scope reads and writes to `session.user.id`.
- Realtime private channel auth now parses allowed channel forms separately, then performs membership checks:
  - `private-user-{userId}` requires the authenticated user id;
  - `private-project-{projectId}` requires project visibility;
  - `private-department-{departmentId}` requires department visibility.

### Query Scoping And Performance

- Project list/detail queries scope non-global actors by project membership or active department membership.
- Department reads scope non-global actors by active department membership.
- Audit activity scopes by global role, actor membership, and actor id fallback.
- Notification inbox scopes by recipient id.
- Project list input caps `pageSize` at 50 and trims search to 120 characters.
- Notification inbox input caps `limit` at 100.
- Current project list pagination is applied after scoped rows are loaded. This preserves current summaries but is a remaining performance risk for large datasets.
- Project list avoids per-row N+1 for task and member counts by batching count queries by project ids.
- Dashboard/report queries include performance notes and use grouped counts where practical.

### Transactions And Conflicts

- Project, department, work item, and collaboration mutations write domain row changes, audit logs, notifications, and outbox events in the same database transaction where applicable.
- File upload consistency keeps network storage outside the DB transaction:
  - upload happens before DB insert;
  - failed DB insert attempts storage cleanup;
  - cleanup failure emits a storage cleanup outbox event.
- Integration coverage now verifies manual transaction rollback.
- Integration coverage now verifies stale project versions are rejected without mutating the project row.
- Unit coverage already verifies stale task and project optimistic versions.

### Protection Paths

- Unit coverage verifies:
  - last active privileged admin cannot be demoted or banned;
  - admins cannot demote or ban themselves;
  - last active department head cannot be orphaned;
  - project owners cannot be removed or role-changed through generic member actions;
  - contributors cannot manage work items through generic management actions;
  - unassigned contributors cannot change task status.
- Integration coverage now verifies cross-department and cross-project denied reads against seeded data.

### Upload Validation

- File uploads validate:
  - UUID task/comment ids;
  - allowed MIME type;
  - positive size up to the configured maximum;
  - file name length and invalid path/control characters.
- Hardening change: forward slash is now rejected in file names to block path-like names such as `../secret.pdf`.
- Link attachments validate URL shape and length.
- Tests do not require Cloudinary or S3 credentials.

### Logs, Audit, And Secret Handling

- Audit entries record business data needed for accountability but do not store raw passwords.
- Session revocation audit redacts specific session tokens as `[redacted]`.
- Bootstrap script logs only the admin email, not the password.
- Provider secrets are read from env and are not intentionally logged.
- Remaining caution: several audit payloads store full parsed business inputs. Continue reviewing any future input that could include secrets before adding it to `newData` or `previousData`.

## Rate Limiting Plan

Rate limiting is not yet implemented. Recommended v1 plan:

- Better Auth route:
  - limit sign-in/sign-up/password endpoints by IP and email identifier;
  - store counters in Redis or a durable edge-compatible KV in production;
  - use short windows for burst protection and longer windows for credential stuffing.
- Upload actions:
  - limit by authenticated user id and task id;
  - enforce daily quota per user and per project;
  - keep current MIME/size validation as the first line of defense.
- Realtime auth:
  - limit by authenticated user id and socket id;
  - reject malformed channel names before provider signing, already implemented.
- Outbox/cron endpoint:
  - prefer internal scheduler/service identity instead of browser session in production;
  - require admin only for manual retry;
  - limit by admin user id and IP.
- Device token registration:
  - limit by user id and token fingerprint;
  - cap active tokens per user and revoke old tokens.

## Remaining Risks

- No runtime rate limiter is wired yet.
- Project list pagination still loads all scoped rows before slicing.
- Better Auth route relies on Better Auth's handler behavior; app-level rate limiting still needs to wrap or sit in front of it.
- E2E browser tests were not added in this phase.
- Cloudinary adapter remains a skeleton; provider-specific signing, deletion, and retry semantics need implementation before production use.
- Seed users exist without Better Auth credentials unless bootstrap/user creation is run; this affects manual login testing, not authorization code paths.

## Verification Added

- `src/test/security-boundaries.test.ts`
- `src/test/security-input-contracts.test.ts`
- `src/test/security-hardening.integration.test.ts`
- `src/infrastructure/realtime/channel-auth.test.ts`
