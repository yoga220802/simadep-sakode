# 08 — Events, Realtime, Notifications, and FCM

## Separation of concerns

- MySQL: authoritative state.
- Notification table: persistent user inbox.
- Outbox: reliable intent to deliver side effects.
- Pusher: foreground realtime signal.
- FCM: optional background push.
- Email: optional formal channel.

## Event naming

Use past-tense versioned names:

- `project.created.v1`
- `project.updated.v1`
- `project.status-changed.v1`
- `project.member-added.v1`
- `project.member-removed.v1`
- `project.member-role-changed.v1`
- `task.created.v1`
- `task.updated.v1`
- `task.status-changed.v1`
- `task.assignee-added.v1`
- `task.assignee-removed.v1`
- `comment.created.v1`
- `attachment.added.v1`
- `user.role-changed.v1`

## Transaction example

Creating a project should atomically:

1. insert project;
2. insert creator as owner;
3. insert audit log;
4. optionally create notifications;
5. insert outbox event;
6. commit.

Network delivery occurs after commit.

## Realtime channel model

Suggested private channels:

- `private-user-{userId}`
- `private-department-{departmentId}`
- `private-project-{projectId}`

Realtime auth route must verify that session user may subscribe to the requested channel. Never accept arbitrary user/project channel based only on client input.

## Minimal realtime payload

```json
{
  "eventId": "uuid",
  "type": "task.updated.v1",
  "projectId": "uuid",
  "resourceId": "uuid",
  "version": 4,
  "occurredAt": "ISO-8601"
}
```

The client invalidates/refetches relevant data. Do not publish full comments, user profile, file metadata, or secret data unless required and authorized.

## Notification recipient examples

- member added: target member; optionally project leadership.
- member removed: target member.
- task assigned: target assignee.
- task status changed: owner/manager and other assignees as appropriate.
- project completed: project members and department leadership.
- user global role changed: target user and security admins.

Prevent duplicate recipients and generally exclude actor.

## FCM implementation

- store device token only after authenticated registration;
- revoke invalid tokens after provider response;
- FCM send failure must not roll back business transaction;
- use server-side Firebase Admin adapter behind interface;
- disable adapter when credentials are absent;
- include no sensitive content in lock-screen payload.
