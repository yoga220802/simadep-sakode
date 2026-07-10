# UI Restoration Component Map - Prompt 14

Date: 2026-07-11

This map tells Prompt 15 where original visual patterns should land inside the current feature-driven architecture. It is not permission to copy legacy services, `AuthContext`, bearer-token calls, or old types.

## Boundary Rules

- UI components may reuse original layout and interaction patterns.
- Server data, mutations, permissions, transactions, audit/outbox, and auth must stay on current feature APIs.
- Client components receive DTOs, server actions, and capability booleans from feature-owned boundaries.
- Imports between features should go through public APIs where practical.
- No component should import Drizzle, database modules, Better Auth internals, or legacy `src/services`.

## Project List

| Original visual component | Target feature-owned location | Notes |
| --- | --- | --- |
| `src/components/projects/ProjectFilterTabs.tsx` | `src/features/projects/ui/project-filter-tabs.tsx` | Restore role/capability-aware status tabs using current summary keys: `all`, `tender`, `active`, `completed`, `cancelled`. |
| `src/components/projects/ProjectYearFilter.tsx` | `src/features/projects/ui/project-year-filter.tsx` | Keep URL-compatible `startYear` and `endYear` values. |
| `src/components/projects/CreateProject.tsx` | `src/features/projects/ui/project-create-button.tsx` | Opens modal only when `canCreateProject` is true. |
| `src/components/projects/ProjectFormModal.tsx` | `src/features/projects/ui/project-form-modal.tsx` | Wrap current `createProjectAction` and `updateProjectAction`; do not call legacy service. |
| `src/components/projects/ProjectCard.tsx` | `src/features/projects/ui/project-card.tsx` | Card navigates to detail and exposes edit/archive only with management capability. |

## Project Detail Shell

| Original visual component | Target feature-owned location | Notes |
| --- | --- | --- |
| `src/components/projects/detail/ProjectHeader.tsx` | `src/features/projects/ui/project-detail-header.tsx` | Restore inline title, status dropdown, status badge, and tab bar. Role visibility must map from current capability matrix. |
| Original tab composition in `src/app/(main)/projects/[id]/page.tsx` | `src/features/projects/ui/project-detail-shell.tsx` plus route composition | Route remains composition root. Shell can be client-side for tab state while data is fetched lazily per tab. |
| `src/components/projects/detail/ProjectDetailView.tsx` | `src/features/projects/ui/project-detail-tab.tsx` | Read-first description, schedule, collaboration/member summary. |
| `src/components/projects/detail/EditScheduleModal.tsx` | `src/features/projects/ui/project-schedule-modal.tsx` | Submit through `updateProjectAction`. |
| `src/components/projects/detail/ManageMembersModal.tsx` | `src/features/projects/ui/project-members-modal.tsx` | Submit through member server actions and current project member policies. |

## Work Items

| Original visual component | Target feature-owned location | Notes |
| --- | --- | --- |
| `src/components/projects/detail/ProjectTaskView.tsx` | `src/features/work-items/ui/project-tasks-tab.tsx` | Owns task filters, sorting, task drawer state, and task modal state. |
| `src/components/projects/detail/TaskFilterControls.tsx` | `src/features/work-items/ui/task-filter-controls.tsx` | Restore hide-completed and my-tasks controls; server or client filtering must remain scoped. |
| `src/components/projects/detail/MilestoneGroup.tsx` | `src/features/work-items/ui/milestone-group.tsx` | Collapsible group and table header. Use current milestone actions. |
| `src/components/projects/detail/TaskRow.tsx` | `src/features/work-items/ui/task-row.tsx` | Table row with expand/collapse subtasks, status, category, assignees, due date, priority, delete action. |
| `src/components/projects/detail/TaskFormModal.tsx` | `src/features/work-items/ui/task-form-modal.tsx` | Create task/subtask/milestone if kept in one modal. Actions remain feature server actions. |
| `src/components/projects/detail/TaskDetailSidebar.tsx` | `src/features/work-items/ui/task-detail-drawer.tsx` | Drawer shell. Collaboration subcomponents should remain in collaboration feature and be composed inside. |
| `src/components/projects/detail/InlineEditComponents.tsx` | `src/features/work-items/ui/inline-task-controls.tsx` | Status display, editable date, priority dropdown. |
| `src/components/projects/detail/TaskStatusCheckbox.tsx` | `src/features/work-items/ui/task-status-control.tsx` | Preserve dedicated status action for assigned contributors. |
| `src/components/projects/detail/AssignTaskPopover.tsx` | `src/features/work-items/ui/assign-task-popover.tsx` | Uses project member DTO; actions: `assignTaskAction`, `unassignTaskAction`. |
| `src/components/projects/detail/AssignCategoryPopover.tsx` | `src/features/work-items/ui/assign-category-popover.tsx` | Uses category DTO and `updateTaskAction` category field or dedicated action if added. |

## Collaboration

| Original visual component | Target feature-owned location | Notes |
| --- | --- | --- |
| `src/components/projects/detail/sidebar/CommentInput.tsx` | `src/features/collaboration/ui/comment-input.tsx` | Submit through `createCommentAction`. |
| `src/components/projects/detail/sidebar/CommentItem.tsx` | `src/features/collaboration/ui/comment-item.tsx` | Delete visibility from author/moderator capability. |
| `src/components/projects/detail/sidebar/AuditLogItem.tsx` | `src/features/collaboration/ui/audit-log-item.tsx` or `src/features/reporting/ui/audit-log-item.tsx` | If audit is project/task activity, keep query in reporting/audit feature and compose display in drawer. |
| `src/components/projects/detail/sidebar/AddAttachmentPopover.tsx` | `src/features/collaboration/ui/add-attachment-popover.tsx` | File/link choice; no real provider credentials needed for tests. |
| `src/components/projects/detail/sidebar/AttachmentItem.tsx` | `src/features/collaboration/ui/attachment-item.tsx` | Delete visibility from uploader/moderator capability. |
| `src/components/projects/detail/sidebar/DetailItem.tsx` | `src/features/work-items/ui/task-detail-item.tsx` | Generic drawer row wrapper can live with task drawer if not collaboration-specific. |

## Categories

| Original visual component | Target feature-owned location | Notes |
| --- | --- | --- |
| `src/components/projects/detail/ProjectCategoryView.tsx` | `src/features/work-items/ui/project-categories-tab.tsx` | Separate tab with table; query can reuse work-item category DTO or add dedicated query. |
| `src/components/projects/detail/CategoryFormModal.tsx` | `src/features/work-items/ui/category-form-modal.tsx` | Submit through `createCategoryAction` and `updateCategoryAction`. |
| `DeleteConfirmationModal` usage | `src/shared/ui/delete-confirmation-modal.tsx` if generic exists or create in shared UI | Only if it is truly generic. Otherwise feature-local confirmation is acceptable. |

## Reporting

| Original visual component | Target feature-owned location | Notes |
| --- | --- | --- |
| `src/components/projects/report/ProjectReportView.tsx` | `src/features/reporting/ui/project-report-tab.tsx` | Restore tab-gated report view using `getProjectReportForActor`. |
| `src/components/projects/report/ReportCharts.tsx` | `src/features/reporting/ui/project-report-charts.tsx` | Reuse presentational chart components if dependencies and props fit current metrics. |

## Route Composition Targets

| Route | Target composition |
| --- | --- |
| `src/app/(main)/projects/page.tsx` | Authenticate, build actor, load scoped list/departments/summary, pass data and capabilities to feature UI. |
| `src/app/(main)/projects/[id]/page.tsx` | Authenticate, load project header/detail minimum, render tab shell, defer tasks/collaboration/report/member-user queries until selected tab/modal/drawer. |
| `src/app/(main)/tasks/page.tsx` | Keep or restore my-tasks table using current task query; do not use legacy task service. |

## Data Loading Targets

- Initial detail route should load only project identity, actor role/capabilities, summary, and data needed by the default Detail tab.
- Member user options should load when the member modal opens.
- Work items should load when Tasks or Categories tab opens.
- Task collaboration should load when task drawer opens for a selected task.
- Report should load when Report tab opens.
- Any lazy-loading route/action must authenticate and authorize server-side.
