# Prompt 16 — Role-Aware UI and Secondary Page Restoration

Run only after project UI restoration is approved.

## Objective

Restore role-specific navigation and interaction density on dashboard, users, departments, and My Tasks while preserving contextual authorization.

## Tasks

1. Replace `mapGlobalRoleToDisplayRole` as the basis for navigation decisions.
2. Build a server-derived/session-safe navigation capability model, such as:
   - canViewUserManagement;
   - canViewDepartments;
   - canViewProjects;
   - canViewMyTasks;
   - dashboardScope.
3. Preserve contextual department/project memberships; do not force all non-admin users into a fake `Team Member` role.
4. Restore original dashboard information hierarchy per actor scope without reintroducing legacy API calls.
5. Move user create form behind an “Tambah User” modal instead of showing password fields permanently above the table.
6. Restore user filters, role badges, table interactions, and confirmation for sensitive actions.
7. Refine department create/member actions using modal/progressive disclosure.
8. Restore My Tasks compact status interaction and task navigation without exposing invalid controls.
9. Remove developer-facing performance notes from production pages.
10. Add role/capability UI tests for all target actor types.

## Acceptance

- navigation matches actual capabilities;
- no fake project-manager/viewer inference from global role;
- sensitive creation forms are not always visible;
- secondary pages match original visual density and clarity;
- server authorization remains unchanged or stronger.
