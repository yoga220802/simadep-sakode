CREATE TABLE `project_task_statuses` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`value` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`display_order` int unsigned NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `project_task_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_task_statuses_project_value_unique` UNIQUE(`project_id`,`value`)
);
--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `status` varchar(80) NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `project_task_statuses` ADD CONSTRAINT `project_task_statuses_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `project_task_statuses_project_order_idx` ON `project_task_statuses` (`project_id`,`display_order`);