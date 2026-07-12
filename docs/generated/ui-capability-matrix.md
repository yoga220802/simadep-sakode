# UI Capability Matrix - Prompt 14

Date: 2026-07-11

This matrix describes target UI visibility for restoration. Server policy remains authoritative and must still validate every action.

## Role Sources

- System roles: `super_admin`, `admin`, `user`.
- Department roles: `head`, `department_admin`, `member`, `viewer`.
- Project roles: `owner`, `manager`, `contributor`, `viewer`.

Current server policy references:

- `src/features/projects/domain/project-policy.ts`
- `src/features/work-items/domain/work-item-policy.ts`
- `src/features/collaboration/domain/collaboration-policy.ts`

## System Role Capabilities

| Capability | super_admin | admin | user |
| --- | --- | --- | --- |
| Access admin/user management | Yes | Yes, except super-admin-only operations if added | No |
| Create managed users | Yes | Target: likely yes for admin, confirm with user management policy | No |
| View all departments/projects | Yes | Yes | Only scoped memberships |
| Create project in any department | Yes | Yes | Only if department `head` or `department_admin` |
| Manage any project metadata/status/archive | Yes | Yes | Only with department/project management role |
| Manage any project members | Yes | Yes | Only with department/project management role |
| Manage tasks, milestones, categories in any project | Yes | Yes | Only with department/project management role |
| View project report | Yes | Yes | Only with department/project management role or explicit project owner/manager |
| Moderate comments/attachments | Yes | Yes | Only with project management role |
| Delete own comments/attachments | Yes | Yes | Yes, when project is visible |

## Department Role Capabilities

| Capability | head | department_admin | member | viewer |
| --- | --- | --- | --- | --- |
| View department navigation/filter | Yes | Yes | Yes | Yes |
| View projects in department | Yes | Yes | Yes | Yes |
| Create project in department | Yes | Yes | No | No |
| Manage department project metadata/status/archive | Yes | Yes | No, unless project role allows | No, unless project role allows |
| Manage project members in department projects | Yes | Yes | No, unless project role allows | No, unless project role allows |
| Manage milestones/tasks/categories in department projects | Yes | Yes | No, unless project role allows | No, unless project role allows |
| View project report for department projects | Yes | Yes | Target: no unless project role allows | Target: no unless project role allows |
| Comment/add attachments on visible tasks | Yes | Yes | Yes | Yes |
| Moderate comments/attachments | Yes | Yes | No, unless project role allows | No |

## Project Role Capabilities

| Capability | owner | manager | contributor | viewer |
| --- | --- | --- | --- | --- |
| View project detail | Yes | Yes | Yes | Yes |
| Edit project title/description/status/schedule | Yes | Yes | No | No |
| Archive project | Yes | Yes | No | No |
| Manage members | Yes | Yes | No | No |
| Remove project owner with generic removal | No | No | No | No |
| Change owner role with generic update | No | No | No | No |
| Create/update/delete milestone | Yes | Yes | No | No |
| Reorder milestone/task | Yes | Yes | No | No |
| Create/update/delete task/subtask | Yes | Yes | No | No |
| Assign/unassign task users | Yes | Yes | No | No |
| Change category/priority/dates | Yes | Yes | No | No |
| Change status for any task | Yes | Yes | No | No |
| Change status for assigned task | Yes | Yes | Yes | No |
| View comments/attachments | Yes | Yes | Yes | Yes |
| Create comments/attachments | Yes | Yes | Yes | Yes |
| Delete own comments/attachments | Yes | Yes | Yes | Yes |
| Delete other users' comments/attachments | Yes | Yes | No | No |
| View report tab | Yes | Yes | Target: no | Target: no |

## UI Visibility Rules For Prompt 15

- Hide management controls when server-derived `canManageProject` or `canManageWorkItems` is false.
- Hide project create entry unless `canCreateProject(actor, departmentId)` is true for at least one visible department.
- Hide member management modal trigger unless `assertCanManageProjectMembers` would pass.
- Show assigned status action only when actor can manage work items or is assigned to that task.
- Hide delete comment control unless actor is comment author or can moderate project collaboration.
- Hide delete attachment control unless actor uploaded the attachment or can moderate project collaboration.
- Hide report tab unless the target report capability says the actor can view it.
- Never use legacy role labels such as `Project Manager`, `Team Member`, or `Admin` as runtime authority. Map visibility from current system, department, and project roles.

## Forms Requiring Capability Props

- Project metadata edit and archive.
- Project member add/update/remove.
- Milestone create/update/delete/order.
- Task create/update/delete/order.
- Assignee/category popovers.
- Comment and attachment delete controls.
- Report tab entry.
