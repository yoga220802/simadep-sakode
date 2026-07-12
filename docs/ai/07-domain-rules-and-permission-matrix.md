# 07 — Domain Rules and Permission Matrix

## Preserved legacy rules

1. Project creator becomes owner.
2. Duplicate project membership is forbidden.
3. Owner cannot remove themselves through generic member removal.
4. Owner role cannot be changed through generic role update.
5. Non-privileged users only see projects in their permitted scope/status.
6. Task and subtask creation require project leadership permission.
7. Task update/delete require owner/manager/admin policy.
8. Only assigned users may use the lightweight task-status action, unless an explicit privileged override use case is called.
9. Assignee must already belong to the project.
10. Completed status sets `completed_at` and calculates finish duration.
11. Moving from completed to another status clears/recalculates completion fields according to policy.
12. Global admin cannot demote the final admin.

## Project status

Values:

- `tender`
- `active`
- `completed`
- `cancelled`

For backward compatibility, use `cancelled` in new code and map legacy `cancel` during data migration.

Suggested transitions:

- tender → active, cancelled
- active → completed, cancelled
- completed → active only through privileged reopen action
- cancelled → tender only through privileged restore action

Do not enforce transitions until product owner confirms; keep policy centralized so it can be enabled later.

## Task status

Values:

- `pending`
- `in_progress`
- `completed`
- `cancelled`

Initial transition policy:

- pending → in_progress, completed, cancelled
- in_progress → pending, completed, cancelled
- completed → in_progress through reopen flow
- cancelled → pending through restore flow

## Permission matrix

Legend: R read, C create, U update, D delete, M manage membership, S change assigned task status.

| Resource | Super Admin | Admin | Dept Head | Dept Admin | Project Owner | Project Manager | Contributor | Viewer |
|---|---|---|---|---|---|---|---|---|
| users | CRUD | CRUD limited | R dept | R dept | - | - | - | - |
| departments | CRUD | CRUD policy | CRUD own | U own | R | R | R | R |
| department members | M | M policy | M | M limited | R | R | R | R |
| projects | CRUD | CRUD policy | CRUD dept | CRUD dept | CRUD own | RU own | R own | R own |
| project members | M | M policy | M dept | M limited | M | M limited | R | R |
| milestones | CRUD | CRUD policy | CRUD dept | CRUD dept | CRUD | CRUD | R | R |
| tasks | CRUD | CRUD policy | CRUD dept | CRUD dept | CRUD | CRUD | R/S assigned | R |
| comments | CRUD moderation | CRUD moderation | CRUD scope | CRUD scope | CRUD scope | CRUD scope | C/R + own D | R |
| attachments | CRUD moderation | CRUD moderation | CRUD scope | CRUD scope | CRUD scope | CRUD scope | C/R + own D | R |
| audit | R | R policy | R dept | R dept | R project | R project | limited | none/limited |

This table is a product baseline; implementation must evaluate memberships and resource state, not role alone.

## Data isolation

All list/detail queries must include one of:

- global privileged scope;
- department membership scope;
- project membership scope;
- explicit ownership/assignment scope.

Never load an entity then rely on client hiding it. Authorization filters belong in repository query and/or policy before returning data.
