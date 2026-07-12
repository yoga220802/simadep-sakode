CREATE INDEX `department_members_department_status_idx` ON `department_members` (`department_id`,`status`);--> statement-breakpoint
CREATE INDEX `projects_deleted_updated_idx` ON `projects` (`deleted_at`,`updated_at`);--> statement-breakpoint
CREATE INDEX `projects_status_updated_idx` ON `projects` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `task_assignees_user_assigned_idx` ON `task_assignees` (`user_id`,`assigned_at`);--> statement-breakpoint
CREATE INDEX `tasks_project_due_idx` ON `tasks` (`project_id`,`due_date`);