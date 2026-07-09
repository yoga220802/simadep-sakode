# Legacy Authorization Model

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

## Legacy Roles

| Role set | Source path | Symbol | Values | Notes |
|---|---|---|---|---|
| Global/system roles | `backend-management-project/app/db/models/role_model.py` | `Role` | `admin`, `project_manager`, `team_member` | Stored in `user_role.role`; profile source is external employee API. |
| Project roles | `backend-management-project/app/db/models/project_member_model.py` | `RoleProject` | `owner`, `contributor`, `viewer` | No legacy `manager` project role exists. |
| Employee role mapping | `backend-management-project/app/core/policies/user_role.py` | `EMPLOYEE_TO_APP_ROLE` | `admin -> admin`, `hrd -> project_manager`, `pegawai -> team_member`, `team_member -> team_member` | External role source is outside repository. |

## Route-Level Checks

| Route source | Function | Check | Notes |
|---|---|---|---|
| `app/api/routes/user_route.py` | `_User.me` | `get_current_user` | Any authenticated user. |
| `app/api/routes/user_route.py` | `_User.get_user_info`, `_User.list_users` | `permission_required([Role.ADMIN, Role.PROJECT_MANAGER])` | Admin or project manager. |
| `app/api/routes/user_route.py` | `_User.change_role` | `get_user_admin` | Admin only. |
| `app/api/routes/project_route.py` | `_Project.list_projects`, `_Project.get_detail_project`, `_Project.get_project_report` | `get_current_user` | Service/repository scopes access. |
| `app/api/routes/project_route.py` | `_Project.create_project` | `get_user_pm` | Project manager or admin only. |
| `app/api/routes/project_route.py` | `_Project.update_project`, `_Project.delete_proyek` | `permission_required([Role.PROJECT_MANAGER, Role.ADMIN])` | Service still requires owner lookup. |
| `app/api/routes/project_member_route.py` | all member mutations | `permission_required([Role.PROJECT_MANAGER, Role.ADMIN])` | Service allows admin or owner depending action. |
| `app/api/routes/milestone_route.py` | all milestone routes | `get_current_user` | Service enforces project/membership rules. |
| `app/api/routes/task_route.py` | create/subtask/detail/status/my tasks | `get_current_user` | Service enforces owner/assignee/scope. |
| `app/api/routes/task_route.py` | delete/update | `get_user_pm` | Route requires admin or project manager; service requires owner for non-admin behavior. |
| `app/api/routes/assignee_task_route.py` | assign/unassign | `get_current_user` | Service requires admin or project owner. |
| `app/api/routes/category_route.py` | create/update/delete/assign/unassign | `permission_required([Role.PROJECT_MANAGER, Role.ADMIN])` | Service update/delete/assign/unassign requires owner and does not bypass admin. |
| `app/api/routes/category_route.py` | list/get | `get_current_user` | Service scopes by membership/admin. |
| `app/api/routes/comment_route.py` | all comment routes | `get_current_user` | Service scopes by membership/admin/author/owner. |
| `app/api/routes/attachment_route.py` | all attachment routes | `get_current_user` | Service scopes by membership/admin/comment author/project owner. |
| `app/api/routes/notification_route.py` | all notification routes | `get_current_user` | Service uses current user id. |
| `app/api/routes/dashboard_route.py` | admin/pm/user dashboards | `get_user_admin`, `get_user_pm`, `get_user_member` | Separate route functions by role. |

## Service-Level And Repository-Level Checks

| Check type | Source path/symbol | Behavior |
|---|---|---|
| Current-user resolution | `app/api/dependencies/user.py::get_current_user` | Validates token externally, loads employee info, syncs `UserRole`, returns `User` DTO with local role. |
| Admin dependency | `app/api/dependencies/user.py::get_user_admin` | Requires `Role.ADMIN`. |
| PM dependency | `app/api/dependencies/user.py::get_user_pm` | Requires `Role.PROJECT_MANAGER` or `Role.ADMIN`. |
| Member dependency | `app/api/dependencies/user.py::get_user_member` | Requires `Role.TEAM_MEMBER`, `Role.PROJECT_MANAGER`, or `Role.ADMIN`. |
| Generic role dependency | `app/api/dependencies/user.py::permission_required` | Rejects when current role is not in provided list. |
| Project detail visibility | `app/services/project_service.py::get_project_detail` + `app/repositories/project_repository.py::get_user_scoped_project_detail` | Repository returns only projects visible to actor/role. |
| Project list visibility | `app/services/project_service.py::list_projects` + `pagination_projects` | Role-aware status and membership filtering. |
| Project owner check | `app/services/project_service.py::get_project_by_owner` | Uses `get_user_project_by_role`; update/delete require owner even when route admits admin/PM. |
| Member add/remove | `app/services/project_service.py::assign_project_member`, `remove_project_member` | Admin can bypass owner required role; non-admin must be owner. |
| Member role update | `app/services/project_service.py::update_member_role` | Admin can use `get_project_by_id`; non-admin must be owner. |
| Task detail/list visibility | `app/services/task_service.py::get_detail_task`, `list_subtask` | Non-admin must be project member. |
| Task create/update/delete | `app/services/task_service.py::*` | Owner required for create/subtask/update/delete; admin behavior varies by method. |
| Task status | `app/core/policies/task.py::ensure_only_assignee_can_change_status` | Only task assignee can use lightweight status route. |
| Assignment | `app/services/task_service.py::assign_user`, `unassign_user` | Admin or project owner required; target assignee membership is not enforced. |
| Category access | `app/services/category_service.py::*` | Create/list/get support admin/member rules; update/delete/assign/unassign require owner only. |
| Comment access | `app/services/comment_service.py::*` | Create/list require member unless admin; delete requires admin, author, or project owner. |
| Attachment access | `app/services/attachment_service.py::*` | Task attachment requires member/admin; comment attachment requires author; delete requires admin/project owner. |
| Notification read/list | `app/services/notification_service.py::*` | Recipient scoped by current user id. |
| WebSocket project subscription | `app/websocket.py::websocket_endpoint` | Token-authenticated connection, but project subscribe/unsubscribe lacks membership check. |
| SSE user binding | `app/sse.py::sse_endpoint` | Accepts `user_id` query without authentication; TODO notes replacement needed. |

## Data Visibility Rules

- Admin users generally receive broad access, but source contains inconsistencies: project update/delete and category update/delete/assign/unassign still require owner checks in service.
- Project managers can create projects and pass some route checks, but project mutations often require project owner membership in service.
- Team members can see project/task/comment data when repository/service membership checks pass.
- Project reports are admin or project owner only in `ProjectService.get_project_report`.
- Notification inbox is recipient scoped.
- Audit timeline is exposed through comment listing only after task project membership/admin check.

## Known Authorization Gaps

| Gap | Source evidence | Risk | Recommendation |
|---|---|---|---|
| SSE user spoofing | `backend-management-project/app/sse.py::sse_endpoint` accepts `user_id` query and has TODO to replace with auth. | High | Target realtime auth must use server session and scoped subscriptions. |
| WebSocket project subscription not scoped | `backend-management-project/app/websocket.py::websocket_endpoint` handles `subscribe`/`unsubscribe` with project id but no membership check. | High | Verify membership before joining project channel. |
| Task assignment does not enforce assignee project membership | `ensure_assignee_is_project_member` exists in `app/core/policies/task.py`, but `TaskService.assign_user` does not call it. | High | Target must enforce same-project membership. |
| Route/service mismatch for category admin actions | route allows admin/PM; `CategoryService._ensure_is_owner` has no admin bypass. | Medium | Decide target policy explicitly. |
| Route/service mismatch for project update/delete | route allows admin/PM; service requires owner lookup. | Medium | Decide target admin/project manager override. |
| No Pusher auth endpoint found | frontend expects `/v1/auth/pusher`; backend source only has optional Pusher test router. | High | Add target `/api/realtime/auth` with session and membership checks. |

## Mapping To Proposed Target Roles

| Legacy role | Proposed target mapping | Confidence | Notes |
|---|---|---:|---|
| `Role.ADMIN` | System `admin`; possibly `super_admin` for seeded owner/admin | Medium | Source has only one admin level. Owner must decide super_admin mapping. |
| `Role.PROJECT_MANAGER` | Unresolved: could map to System `user` plus Department `head`/`department_admin`, or Project `manager` when scoped | Low | Legacy role is global and not equivalent to target contextual roles. Owner decision required. |
| `Role.TEAM_MEMBER` | System `user` | High | Department/project memberships provide contextual permissions in target. |
| `RoleProject.OWNER` | Project `owner` | High | Direct mapping. |
| `RoleProject.CONTRIBUTOR` | Project `contributor` | High | Direct mapping. |
| `RoleProject.VIEWER` | Project `viewer` | High | Direct mapping. |
| no legacy project manager role | Project `manager` | Low | Target-only improvement; owner must define migration source. |
| no legacy department roles | Department `head`, `department_admin`, `member`, `viewer` | Low | Target-only model; no source mapping found. |

