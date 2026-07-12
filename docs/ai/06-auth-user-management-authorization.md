# 06 — Authentication, User Management, and Authorization

## Better Auth responsibilities

- credentials/account lifecycle;
- password hashing;
- email verification/reset if enabled;
- session creation and revocation;
- admin user operations supported by plugin;
- global role field or plugin-compatible global authorization;
- ban/unban and session invalidation.

## SIMADEP responsibilities

- employee/profile metadata;
- department membership;
- project membership;
- business permission policies;
- audit of administrative changes;
- user directory and filters;
- invitation or account provisioning workflow.

## Account provisioning v1

Recommended flow:

1. `super_admin/admin` creates user with name, email, temporary password or invitation.
2. Better Auth creates identity.
3. SIMADEP creates `user_profiles` row in same application operation where feasible.
4. User receives verification/reset instructions if email infrastructure is configured.
5. User joins department through separate authorized action.

No external employee API is required.

## Global roles

| Role | Scope |
|---|---|
| `super_admin` | full system administration and protected owner-level operations |
| `admin` | user management and cross-department operational administration based on policy |
| `user` | normal account; access comes from department/project memberships |

## Department roles

| Role | Capabilities |
|---|---|
| `head` | manage department, members, department projects, reporting |
| `department_admin` | operational member/project management, excluding protected head transfer |
| `member` | participate in allowed projects |
| `viewer` | read department-visible data only |

## Project roles

| Role | Capabilities |
|---|---|
| `owner` | protected ownership, project configuration, members, work items |
| `manager` | manage project/work items except ownership-sensitive actions |
| `contributor` | view and collaborate; update assigned task status |
| `viewer` | read-only |

## Authorization API

Policies should be explicit:

```ts
canViewDepartment(actor, department)
canManageDepartment(actor, membership)
canManageDepartmentMembers(actor, membership)
canViewProject(actor, project, memberships)
canUpdateProject(actor, project, projectMembership)
canManageProjectMembers(actor, project, projectMembership)
canCreateTask(actor, projectMembership)
canUpdateTask(actor, task, projectMembership)
canChangeTaskStatus(actor, task, assigneeIds)
canCommentOnTask(actor, taskAccess)
canDeleteComment(actor, comment, taskAccess)
```

Do not scatter role string comparisons across UI/server actions.

## Protected invariants

- At least one active `super_admin` must remain.
- An admin cannot demote their own global role through normal UI.
- The last active privileged admin cannot be removed/demoted.
- A department should not lose its only active head without transfer/archive flow.
- A project must have one owner in v1.
- Project owner cannot be removed or role-changed through generic member update.
- Target assignee must be active project member.
- Disabled/banned users cannot create new sessions and existing sessions are revoked as configured.

## Session usage

- Resolve session server-side.
- Expose only safe session data to client.
- Never manually store bearer token in localStorage or custom JS cookie.
- Middleware may redirect unauthenticated users, but it is not the authorization layer.
