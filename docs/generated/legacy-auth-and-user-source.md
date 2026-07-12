# Legacy Authentication And User Source Report

Generated: 2026-07-09

Backend reference inspected: `../backend-management-project/`.

## Login Flow

| Step | Source path | Symbol | Behavior |
|---|---|---|---|
| 1 | `backend-management-project/app/api/routes/auth_route.py` | `_Auth.login` | Accepts `OAuth2PasswordRequestForm` username/password at `POST /v1/auth/login`. |
| 2 | `backend-management-project/app/api/dependencies/authentication.py` | `AuthHandler.login` | Delegates credentials to `PegawaiService.login`; maps returned external employee profile. |
| 3 | `backend-management-project/app/services/user_service.py` | `UserService.assign_role_to_user` | Ensures local `UserRole` row exists/reflects mapped external role. |
| 4 | `backend-management-project/app/api/routes/auth_route.py` | `_Auth.login` | Calls `uow.commit()` and returns `AuthToken`. |

No Better Auth, cookie session, password table, local password verification, or refresh-token model was found in legacy source.

## Token Validation And Current User

| Concern | Source path | Symbol | Behavior |
|---|---|---|---|
| OAuth2 bearer extraction | `app/api/dependencies/authentication.py` | `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login", auto_error=False)` | Token is read from `Authorization: Bearer`. |
| Token validation | `app/api/dependencies/authentication.py` | `AuthHandler.validate_token` | Calls `PegawaiService.validate_token`; invalid token raises `UnauthorizedError("Token tidak valid")` with `WWW-Authenticate: Bearer`. |
| Current-user profile | `app/api/dependencies/user.py` | `get_current_user` | Uses token to fetch external current employee info, syncs local role, returns `User` DTO. |
| Admin/PM/member dependencies | `app/api/dependencies/user.py` | `get_user_admin`, `get_user_pm`, `get_user_member` | Check local role enum and raise `UnauthorizedError` on mismatch. |
| Generic role dependency | `app/api/dependencies/user.py` | `permission_required` | Compares `user.role` to allowed roles. |

## External Employee API Integration

| Source path | Symbol | Behavior |
|---|---|---|
| `backend-management-project/app/core/config/settings.py` | `Settings.BASE_API_PEGAWAI` | Required base URL for employee service. |
| `backend-management-project/app/core/config/api_pegawai.py` | `PegawaiApiUrls` | Builds external URLs: `api/login`, `api/auth/validation`, `api/pegawai/me`, `api/pegawai-list`, `api/pegawai/bulk`, `api/pegawai/{user_id}`. |
| `backend-management-project/app/client/pegawai_client.py` | `PegawaiApiClient`, `PegawaiAiohttpClient` | Performs login, token validation, current user, detail/list/bulk employee requests. |
| `backend-management-project/app/services/pegawai_service.py` | `PegawaiService` | Wraps client and maps external payloads to local `UserBase`/`User` schemas. |

## User Cache And Synchronization

| Item | Legacy behavior |
|---|---|
| User profile storage | Not found as local SQLAlchemy table. Profile data comes from external employee API. |
| Local user role storage | `user_role` table stores `user_id` integer and global `Role`. |
| Role synchronization | `UserService.assign_role_to_user` maps external employee role to local `UserRole`. `UserService.list_user` can bulk-create missing local role rows while listing external employees. |
| Profile enrichment | Project member, comments, reports, dashboard flows call `PegawaiService` to enrich integer IDs into names/emails/profile URLs. |
| Legacy user ID type | Integer employee ID. |
| Session expiration | Not defined locally; delegated to external token validation. |

## Failure Behavior

| Failure | Source evidence | Behavior |
|---|---|---|
| Missing/invalid bearer token | `AuthHandler.validate_token` | Raises `UnauthorizedError("Token tidak valid")`. |
| Role dependency mismatch | `get_user_admin`, `get_user_pm`, `get_user_member`, `permission_required` | Raises `UnauthorizedError` with role-specific message. |
| External user detail missing | `UserService.get_user` and route callers | Service exceptions propagate to route-level exception handlers. |
| Last admin demotion | `ensure_not_demote_last_admin` | Blocks role update. |
| Admin self-demotion | `ensure_admin_not_change_own_role` | Blocks role update. |

## Security Risks

- Password verification is delegated to an external service; no local password policy is visible in this repository.
- Browser/frontend currently stores bearer token for the legacy API; target should replace this with Better Auth session cookies.
- Current-user resolution calls external services during request handling, creating availability coupling.
- Legacy local roles can drift from external role source unless every relevant flow synchronizes.
- `.env.example` uses `API_PEGAWAI`, while `Settings` requires `BASE_API_PEGAWAI`; this naming mismatch can break configuration if not reconciled.

## Mapping To Better Auth And SIMADEP

| Legacy concept | Target concept | Notes |
|---|---|---|
| External token login | Better Auth credential/session flow | Target should own credential/session lifecycle unless employee SSO is introduced intentionally. |
| `AuthToken` bearer response | Better Auth session cookie/session API | Do not expose long-lived bearer token to client code. |
| External employee integer ID | `user_profiles.legacy_id` | Preserve as nullable unique migration key. |
| External profile fields | SIMADEP employee/profile entity | Decide sync ownership and fallback behavior. |
| `user_role.role=admin` | System `admin` or seeded `super_admin` | Owner must decide super_admin bootstrap. |
| `user_role.role=project_manager` | Unresolved contextual mapping | Could become department head/admin or project manager assignments, not a global role by default. |
| `user_role.role=team_member` | System `user` | Department/project membership grants contextual rights. |
| `get_current_user` dependency | `getCurrentSessionUser` server helper | Resolve once per server action/route handler. |
| `permission_required` | contextual policy functions | Target policies must include resource membership/department checks, not just global role. |

