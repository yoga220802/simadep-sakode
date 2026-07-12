# UI Parity Matrix - Prompt 14

Date: 2026-07-11

Scope: project-related UI parity freeze. This document is specification only and must not reintroduce bearer-token auth, legacy frontend services, legacy API calls, or old data types.

## Source Inventories

Original UI reference was inspected from `legacy/simadep-sakode-main.zip` after temporary extraction. Runtime code must not import from these files.

Original project UI files compared:

- `src/app/(main)/projects/page.tsx`
- `src/app/(main)/projects/[id]/page.tsx`
- `src/app/(main)/tasks/page.tsx`
- `src/components/projects/CreateProject.tsx`
- `src/components/projects/ProjectCard.tsx`
- `src/components/projects/ProjectFilterTabs.tsx`
- `src/components/projects/ProjectFormModal.tsx`
- `src/components/projects/ProjectYearFilter.tsx`
- `src/components/projects/detail/ProjectHeader.tsx`
- `src/components/projects/detail/ProjectDetailView.tsx`
- `src/components/projects/detail/ManageMembersModal.tsx`
- `src/components/projects/detail/EditScheduleModal.tsx`
- `src/components/projects/detail/ProjectTaskView.tsx`
- `src/components/projects/detail/TaskFilterControls.tsx`
- `src/components/projects/detail/MilestoneGroup.tsx`
- `src/components/projects/detail/TaskRow.tsx`
- `src/components/projects/detail/TaskStatusCheckbox.tsx`
- `src/components/projects/detail/InlineEditComponents.tsx`
- `src/components/projects/detail/TaskFormModal.tsx`
- `src/components/projects/detail/TaskDetailSidebar.tsx`
- `src/components/projects/detail/AssignTaskPopover.tsx`
- `src/components/projects/detail/AssignCategoryPopover.tsx`
- `src/components/projects/detail/ProjectCategoryView.tsx`
- `src/components/projects/detail/CategoryFormModal.tsx`
- `src/components/projects/detail/sidebar/AddAttachmentPopover.tsx`
- `src/components/projects/detail/sidebar/AttachmentItem.tsx`
- `src/components/projects/detail/sidebar/AuditLogItem.tsx`
- `src/components/projects/detail/sidebar/CommentInput.tsx`
- `src/components/projects/detail/sidebar/CommentItem.tsx`
- `src/components/projects/detail/sidebar/DetailItem.tsx`
- `src/components/projects/report/ProjectReportView.tsx`
- `src/components/projects/report/ReportCharts.tsx`

Current implementation compared:

- `src/app/(main)/projects/page.tsx`
- `src/app/(main)/projects/[id]/page.tsx`
- `src/features/projects/ui/project-forms.tsx`
- `src/features/projects/application/project-use-cases.ts`
- `src/features/projects/server/project-actions.ts`
- `src/features/work-items/ui/project-work-items-panel.tsx`
- `src/features/work-items/ui/work-item-task-card.tsx`
- `src/features/work-items/server/work-item-actions.ts`
- `src/features/work-items/application/work-item-queries.ts`
- `src/features/collaboration/ui/task-collaboration-panel.tsx`
- `src/features/collaboration/server/collaboration-actions.ts`
- `src/features/collaboration/application/collaboration-use-cases.ts`
- `src/features/collaboration/application/attachment-use-cases.ts`
- `src/features/reporting/ui/project-report-panel.tsx`
- `src/features/reporting/application/project-report-queries.ts`

## Parity Matrix

| Area | Original component/path | Original interaction | Current component/path | Current interaction | Regression | Target interaction | Existing new server query/action to retain | Capability required | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Project list | `src/app/(main)/projects/page.tsx`, `ProjectFilterTabs.tsx`, `ProjectYearFilter.tsx`, `ProjectCard.tsx`, `Pagination.tsx` | Client page loads projects, shows role-specific status tabs with counts, year range filter, 3-column cards, pagination, empty/loading states, card actions for edit/delete. | `src/app/(main)/projects/page.tsx` | Server page shows search, department, status, year filters, summary cards, inline create form, cards as links, simple next/previous paging. | Loses original status tab hierarchy, role-specific filter visibility, card actions, modal create/edit/delete flow, and richer loading state. | Restore original list information hierarchy: tabs and year filter on left, create button on right when allowed, card grid, pagination, empty/loading states. Keep current server-backed URL filters and scoped results. | `getProjectActor`, `listProjectDepartmentsForActor`, `listProjectsForActor`, `createProjectAction`, `canCreateProject`. | View: any actor with scoped projects. Create: `super_admin`, `admin`, department `head`, department `department_admin`. | Actor sees only scoped projects. Counts match scoped filters. Filter state is URL-shareable or otherwise preserved. Create entry is hidden when `canCreateProject` is false. |
| Create/edit/delete project | `ProjectFormModal.tsx`, `DeleteConfirmationModal.tsx`, original `projects/page.tsx` handlers | Create and edit use the same modal; delete opens confirmation modal; create success routes to project detail; edit/delete refresh list. | `ProjectCreateForm`, `ProjectEditForm`, archive form in `project-forms.tsx` | Create form is inline on list. Edit/archive are always rendered on detail page. Delete is implemented as archive, not list modal delete. | Modal workflow and destructive confirmation are gone; edit controls may be visible to actors later denied by server. | Use modal for create/edit and confirmation modal for archive/delete. Preserve archive semantics if hard delete is disallowed by current backend. Only show controls with server-derived capability. | `createProjectAction`, `updateProjectAction`, `archiveProjectAction`, `getProjectDetailForActor`. | Manage: `super_admin`, `admin`, project `owner`, project `manager`, department `head`, department `department_admin`. | Non-managers never see edit/archive affordances. Archive/delete requires confirmation. Optimistic version conflict message remains visible. |
| Project header | `ProjectHeader.tsx` | Header has inline title edit for project manager, status dropdown for project manager, status badge for others, tab bar with role-specific tabs: Detail, Daftar Tugas, Kategori, Laporan. | `src/app/(main)/projects/[id]/page.tsx` | Static title, department, status chip, actor role chip, version chip; no tab bar; all panels render sequentially. | No tab navigation, no inline title/status interaction, report visibility is not tab gated. | Restore header and tab shell using current roles/capabilities, not legacy role names. Inline title/status edit only when `canManageProject` is true. | `getProjectDetailForActor`, `updateProjectAction`, `canManageProject`, `getProjectActor`. | View project plus manage capability for editing. Report tab visibility per capability matrix. | Header remains server-authenticated. Tabs do not fetch hidden tab data until selected or needed. |
| Detail tab | `ProjectDetailView.tsx`, `InlineEditComponents.tsx` | Detail tab shows description, schedule, collaboration members. PM can inline edit description and open schedule/member modals. | `ProjectEditForm`, `ProjectMembersPanel` in `projects/[id]/page.tsx` | Metadata and members are editable forms always present in page layout. | Detail view became an admin form surface rather than progressive disclosure. | Detail tab should show read-first project description, schedule, and member avatars. Edit affordances open inline editor/modal only for managers. | `getProjectDetailForActor`, `updateProjectAction`, `listAssignableProjectUsers`, project member actions. | View: `canViewProject`. Manage: `canManageProject`. | Viewer/contributor gets read-only detail. Manager gets pencil actions. No members/user list loaded until member modal is opened unless already needed. |
| Members | `ProjectDetailView.tsx`, `ManageMembersModal.tsx` | Member avatars visible in detail. Add/manage opens modal with current members, available users, role selection, add/remove/update flows. | `ProjectMembersPanel` in `project-forms.tsx` | Full member management table and add form are always on detail page. | Modal usage, avatar-first display, and progressive disclosure are lost; controls can be visible before server denial. | Restore avatar row and "Tambah Anggota" modal. Modal uses current project member policies and protects owner/last privileged constraints. | `addProjectMemberAction`, `updateProjectMemberAction`, `removeProjectMemberAction`, `listAssignableProjectUsers`, `assertCanManageProjectMembers`. | Manage: `super_admin`, `admin`, department `head`, department `department_admin`, project `owner`, project `manager`. | Non-managers see member avatars only. Managers cannot remove owner through generic removal. Global admins can only be assigned owner per current policy. |
| Schedule | `ProjectDetailView.tsx`, `EditScheduleModal.tsx` | Schedule is read-only dates with calendar icons; manager opens dedicated schedule modal. | `ProjectEditForm` | Start/end dates are regular fields inside the always-visible metadata form. | Dedicated schedule modal and read-first layout are gone. | Restore read-only schedule section with edit modal for start/end dates. | `updateProjectAction`, optimistic version in `ProjectDetail`. | Manage: `canManageProject`. | Modal validates date fields, submits through server action, refreshes detail, preserves version conflict handling. |
| Tasks tab | `ProjectHeader.tsx`, `ProjectTaskView.tsx`, `TaskFilterControls.tsx` | Tab lazy-loads tasks. Shows hide completed, "my tasks", sort controls, grouped milestone table, task/subtask controls, drawer for detail. | `ProjectWorkItemsPanel`, `TaskCard` | Work items render immediately below metadata. Cards expose forms and details inline. | Loses task tab, table density, filter/sort controls, drawer, and scan-friendly structure. | Restore "Daftar Tugas" tab with filter/sort controls and table grouped by milestone. Use current server actions and DTOs. | `listProjectWorkItems`, `createTaskAction`, `updateTaskAction`, `deleteTaskAction`, `changeTaskStatusAction`. | View: `canViewProject`. Manage: `canManageWorkItems`. Assigned status: assignee or manager. | Tasks are scoped to project. Status action remains available to assigned contributors. No collaboration data loads before drawer opens. |
| Milestones | `MilestoneGroup.tsx`, `TaskFormModal.tsx`, `DeleteConfirmationModal.tsx` | Collapsible milestone group. Owner can inline rename, create task with modal, delete with confirmation, create milestone via button. | `ProjectWorkItemsPanel` | Milestones are gray card groups with always-visible edit form, display order field, delete button, and `details` create form. | Collapsible table layout, hover edit affordance, modal task creation, and confirmation emphasis are missing. | Restore collapsible milestone groups and inline rename; use modal for create task; confirmation for delete. Keep display order capability through drag/order action or compact control if needed. | `createMilestoneAction`, `updateMilestoneAction`, `reorderMilestonesAction` if exposed by current server, `deleteMilestoneAction`. | Manage: `canManageWorkItems`. | Delete is blocked when milestone has tasks, with server error surfaced. Order updates stay project-local. |
| Task create/edit/delete | `TaskFormModal.tsx`, `TaskRow.tsx`, `TaskDetailSidebar.tsx`, `DeleteConfirmationModal.tsx` | Create task/subtask opens modal. Edit mostly occurs through row inline controls and drawer. Delete opens confirmation modal. | `TaskFormFields`, `TaskCard` | Create/edit forms are embedded in cards/details; delete is direct form button. | Modal and confirmation flows are gone; page gets visually heavy. | Restore modal for create task/subtask and drawer/in-row edit for focused fields; delete requires confirmation. | `createTaskAction`, `createSubtaskAction`, `updateTaskAction`, `deleteTaskAction`, `assertTaskRelationProject`, optimistic task version. | Manage: `canManageWorkItems`. | Assignee/category/milestone relations must remain in same project. Version conflict is displayed. Delete only appears to managers. |
| Task detail drawer | `TaskDetailSidebar.tsx`, `DetailItem.tsx`, sidebar item components | Clicking task title opens right drawer. Drawer supports nested task navigation/back, title/description edit, assignee, due date, priority, status, subtasks, attachments, comments, audit timeline. | `TaskCard`, `TaskCollaborationPanel` | Task detail and collaboration are inline in every card/details block. | Drawer, nested navigation, progressive disclosure, and timeline composition are missing. | Restore right drawer. Drawer fetches task detail/collaboration on open and retains current server actions. | `listProjectWorkItems` for base list, targeted task detail query if added, `listProjectTaskCollaboration` scoped to selected task, work item and collaboration actions. | View: `canViewProject`. Manage edit: `canManageWorkItems`. Assigned status: assigned contributor or manager. | Opening drawer does not load unrelated task comments/attachments. Back navigation works for subtask chain. |
| Assignee popover | `AssignTaskPopover.tsx`, `TaskRow.tsx`, `TaskDetailSidebar.tsx` | Clicking assignee avatars opens popover with contributor list, avatar/name/email, "Ditugaskan" chip, toggle assign/unassign. | `TaskCard` | Select dropdown plus direct assign button; unassign is a list of text buttons. | Popover affordance, multi-assignee toggle, and member visual context are lost. | Restore popover with project members only, preferably contributors plus eligible managers if business rules allow. Keep current assignee policy. | `assignTaskAction`, `unassignTaskAction`, `assertAssigneeIsProjectMember`. | Manage: `canManageWorkItems`. | Popover never lists users outside project. Assign/unassign refreshes selected task/list and shows errors without closing unexpectedly. |
| Category popover | `AssignCategoryPopover.tsx` | Category cell opens searchable popover, selecting current category toggles removal, clear action shown when assigned. | `TaskFormFields` in `TaskCard` | Category is a select field inside edit form. | Searchable focused popover and one-click clear are gone. | Restore category popover in task row/drawer for managers. | `updateTaskAction` currently carries `categoryId`; category CRUD actions remain separate. | Manage: `canManageWorkItems`. | Only categories from same project are selectable. Clearing category submits null/empty value through current contract. |
| Comments | `TaskDetailSidebar.tsx`, `CommentInput.tsx`, `CommentItem.tsx`, `AuditLogItem.tsx` | Comments and audit are in task drawer timeline. Comment input is at bottom. Author or owner can delete; audit rows are interleaved. | `TaskCollaborationPanel` | Comments render inside expandable inline details for every task; delete button renders for all visible comments and relies on server denial. | Drawer timeline, author-scoped delete visibility, and audit interleaving are missing. | Restore comments into drawer timeline. Hide delete unless current actor is author or moderator. | `createCommentAction`, `deleteCommentAction`, `listProjectTaskCollaboration`, `assertCanDeleteComment`. | Create: `canViewProject`. Delete: author or `canManageProject`. | Delete control visibility matches server policy. No audit row exposes secrets. |
| Attachments | `TaskDetailSidebar.tsx`, `AddAttachmentPopover.tsx`, `AttachmentItem.tsx` | Drawer has task attachments; add button opens popover for file upload or link modal; comment attachments can be added from comment input. | `TaskCollaborationPanel`, `AttachmentForms` | File and link forms render inline in every collaboration details block; delete button renders broadly and relies on server denial. | Add attachment popover/modal and focused drawer placement are gone; delete visibility too broad. | Restore AddAttachmentPopover for file/link choices inside drawer. Hide delete unless uploader or moderator. | `createFileAttachmentAction`, `createLinkAttachmentAction`, `deleteAttachmentAction`, storage adapter validation. | Create: `canViewProject`. Delete: uploader or `canManageProject`. | MIME, size, filename, and URL validation errors surface in drawer. No provider call occurs inside business transaction. |
| Categories tab | `ProjectCategoryView.tsx`, `CategoryFormModal.tsx`, `DeleteConfirmationModal.tsx` | Separate tab with category table. Owner can add/edit via modal and delete via confirmation. | `ProjectWorkItemsPanel` | Categories appear as inline editable chips/forms above milestones. | Separate category management tab and table are gone. | Restore "Kategori" tab with table and add/edit modal. Keep category CRUD actions from work-items feature. | `createCategoryAction`, `updateCategoryAction`, `deleteCategoryAction`, `listProjectWorkItems` or dedicated category query. | View: `canViewProject`. Manage: `canManageWorkItems`. | Non-managers see table without actions. Managers get modal and confirmation. |
| Report tab | `ProjectHeader.tsx`, `ProjectReportView.tsx`, `ReportCharts.tsx` | Report is a tab visible to Admin and Project Manager. It lazy-loads report and milestones, shows stat cards, assignee/weekly/priority/total charts, estimation chart with milestone dropdown. | `ProjectReportPanel`, `getProjectReportForActor` | Report renders below work items immediately for every actor who can view detail. | Report is no longer tab-gated, role-gated, or lazy-loaded; milestone filter parity may be incomplete. | Restore "Laporan" tab visible to reporting-capable actors. Reuse current report query and presentational chart components where safe. | `getProjectReportForActor`, reporting metrics helpers. | Target: `super_admin`, `admin`, department `head`, department `department_admin`, project `owner`, project `manager`; confirm if contributor/viewer should be excluded. | Report is not fetched until tab opens. Metrics match current definitions for status and completion duration. |

## Current Visible Forms Or Actions That May Be Server-Denied

- `ProjectEditForm` in `src/app/(main)/projects/[id]/page.tsx` is rendered for every actor who can view the project. Server can deny update/archive through `assertCanManageProject`.
- `ProjectMembersPanel` and member row role/remove forms are rendered for every actor who can view the project. Server can deny add/update/remove through project member policy.
- `TaskCollaborationPanel` delete comment and delete attachment controls render for every listed item. Server can deny delete unless actor is author/uploader or project moderator.
- `TaskCard` status change form renders for every viewer of work items. Server permits managers and assigned users, and denies unrelated viewers/contributors.
- `ProjectReportPanel` renders for every viewer because the detail page always calls `getProjectReportForActor`. If target UI keeps legacy report visibility, contributors/viewers may see a tab/panel that should be hidden.
- Category update inputs in `ProjectWorkItemsPanel` are rendered whenever categories exist, while delete is gated by `workItems.canManage`. The update form should also be gated.

## Current Queries Loading Data Before User Intent

- `src/app/(main)/projects/[id]/page.tsx` loads `listAssignableProjectUsers` before the member modal is opened.
- The same page loads `listProjectWorkItems`, `listProjectTaskCollaboration`, and `getProjectReportForActor` before the actor opens Tasks, task drawer, collaboration details, or Report.
- `listProjectTaskCollaboration(actor, id)` loads comments and attachments for all tasks in the project, but the original UI only needed these after a task drawer opens.
- `listProjectWorkItems(actor, id)` loads milestones, tasks, categories, project members, and assignees together. That is acceptable for the Tasks tab, but should not run for Detail-only visits.
- `getProjectReportForActor(actor, id)` computes report metrics before the Report tab is selected.
- Project list currently computes scoped page and summary on server. This is valid for the list screen, but next parity work should preserve pagination limits and avoid client-side broad fetches.

## Screenshot Checklist

Browser tooling is available, but runtime code was intentionally not changed in this prompt. Use this checklist in Prompt 15 after UI restoration begins:

- Project list as super admin/admin: status tabs, year filter, create button, card grid, pagination.
- Project list as department viewer/project viewer: no create/edit/delete affordance.
- Project detail as manager/owner: header inline edit, status dropdown, tabs visible including Report.
- Project detail as contributor/viewer: read-only header/detail, no management controls, Report hidden if target capability excludes it.
- Detail tab: description read/edit, schedule modal, member avatar row and member modal.
- Tasks tab: filters, milestone groups, row expand, task/subtask modal, confirmation delete.
- Task drawer: nested navigation, status action, assignee/category popovers, comments, attachments, audit timeline.
- Categories tab: read table for viewers, add/edit/delete modal/confirmation for managers.
- Report tab: chart cards, milestone estimation dropdown, no eager fetch before tab selection.
