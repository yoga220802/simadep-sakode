CREATE TABLE `user_profiles` (
	`user_id` varchar(36) NOT NULL,
	`employee_number` varchar(50),
	`legacy_employee_id` bigint unsigned,
	`display_name` varchar(150) NOT NULL,
	`position` varchar(120),
	`work_unit` varchar(150),
	`phone` varchar(50),
	`avatar_url` varchar(500),
	`employment_status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`joined_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `user_profiles_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `user_profiles_employee_number_unique` UNIQUE(`employee_number`),
	CONSTRAINT `user_profiles_legacy_employee_id_unique` UNIQUE(`legacy_employee_id`)
);
--> statement-breakpoint
CREATE TABLE `department_members` (
	`id` varchar(36) NOT NULL,
	`department_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('head','department_admin','member','viewer') NOT NULL DEFAULT 'member',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`joined_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`ended_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `department_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `department_members_department_user_unique` UNIQUE(`department_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`created_by` varchar(36),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`archived_at` datetime(3),
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `project_members` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role` enum('owner','manager','contributor','viewer') NOT NULL DEFAULT 'contributor',
	`created_by` varchar(36),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_members_project_user_unique` UNIQUE(`project_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`legacy_id` bigint unsigned,
	`department_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`status` enum('draft','active','on_hold','completed','archived') NOT NULL DEFAULT 'draft',
	`start_date` date,
	`end_date` date,
	`created_by` varchar(36),
	`version` int unsigned NOT NULL DEFAULT 1,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`deleted_at` datetime(3),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_legacy_id_unique` UNIQUE(`legacy_id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` varchar(36) NOT NULL,
	`legacy_id` bigint unsigned,
	`project_id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`display_order` int unsigned NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`),
	CONSTRAINT `milestones_legacy_id_unique` UNIQUE(`legacy_id`),
	CONSTRAINT `milestones_project_order_unique` UNIQUE(`project_id`,`display_order`)
);
--> statement-breakpoint
CREATE TABLE `task_assignees` (
	`id` varchar(36) NOT NULL,
	`task_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`assigned_by` varchar(36),
	`assigned_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `task_assignees_id` PRIMARY KEY(`id`),
	CONSTRAINT `task_assignees_task_user_unique` UNIQUE(`task_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `task_categories` (
	`id` varchar(36) NOT NULL,
	`legacy_id` bigint unsigned,
	`project_id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` varchar(500),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `task_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `task_categories_legacy_id_unique` UNIQUE(`legacy_id`),
	CONSTRAINT `task_categories_project_name_unique` UNIQUE(`project_id`,`name`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`legacy_id` bigint unsigned,
	`project_id` varchar(36) NOT NULL,
	`milestone_id` varchar(36) NOT NULL,
	`parent_id` varchar(36),
	`category_id` varchar(36),
	`name` varchar(200) NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','review','done','blocked','cancelled') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent'),
	`display_order` int unsigned NOT NULL DEFAULT 0,
	`start_date` date,
	`due_date` date,
	`estimated_duration_minutes` int unsigned,
	`finished_duration_minutes` int unsigned,
	`completed_at` datetime(3),
	`created_by` varchar(36),
	`version` int unsigned NOT NULL DEFAULT 1,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_legacy_id_unique` UNIQUE(`legacy_id`)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` varchar(36) NOT NULL,
	`legacy_id` bigint unsigned,
	`task_id` varchar(36) NOT NULL,
	`comment_id` varchar(36),
	`uploaded_by` varchar(36),
	`kind` enum('file','link') NOT NULL DEFAULT 'file',
	`file_name` varchar(255) NOT NULL,
	`storage_key` varchar(500),
	`external_url` varchar(1000),
	`mime_type` varchar(120),
	`size_bytes` bigint unsigned,
	`checksum_sha256` char(64),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `attachments_legacy_id_unique` UNIQUE(`legacy_id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(36) NOT NULL,
	`legacy_id` bigint unsigned,
	`task_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3),
	`deleted_at` datetime(3),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`),
	CONSTRAINT `comments_legacy_id_unique` UNIQUE(`legacy_id`)
);
--> statement-breakpoint
CREATE TABLE `device_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`provider` enum('fcm') NOT NULL DEFAULT 'fcm',
	`token` varchar(512) NOT NULL,
	`device_name` varchar(120),
	`last_seen_at` datetime(3),
	`revoked_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `device_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`recipient_id` varchar(36) NOT NULL,
	`actor_id` varchar(36),
	`type` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`message` varchar(500) NOT NULL,
	`project_id` varchar(36),
	`task_id` varchar(36),
	`data` json,
	`is_read` boolean NOT NULL DEFAULT false,
	`read_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`correlation_id` varchar(80),
	`performed_by` varchar(36),
	`department_id` varchar(36),
	`project_id` varchar(36),
	`task_id` varchar(36),
	`resource_type` varchar(80) NOT NULL,
	`resource_id` varchar(80),
	`action_type` varchar(80) NOT NULL,
	`previous_data` json,
	`new_data` json,
	`metadata` json,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` varchar(36) NOT NULL,
	`event_type` varchar(120) NOT NULL,
	`aggregate_type` varchar(80) NOT NULL,
	`aggregate_id` varchar(80) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',
	`attempt_count` int unsigned NOT NULL DEFAULT 0,
	`available_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`processed_at` datetime(3),
	`last_error` text,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `outbox_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `department_members` ADD CONSTRAINT `department_members_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_members` ADD CONSTRAINT `project_members_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `milestones` ADD CONSTRAINT `milestones_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_assignees` ADD CONSTRAINT `task_assignees_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_categories` ADD CONSTRAINT `task_categories_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_milestone_id_milestones_id_fk` FOREIGN KEY (`milestone_id`) REFERENCES `milestones`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parent_id_tasks_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_category_id_task_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `task_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_task_id_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `department_members_user_idx` ON `department_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `departments_status_idx` ON `departments` (`status`);--> statement-breakpoint
CREATE INDEX `project_members_user_project_idx` ON `project_members` (`user_id`,`project_id`);--> statement-breakpoint
CREATE INDEX `projects_department_status_idx` ON `projects` (`department_id`,`status`);--> statement-breakpoint
CREATE INDEX `projects_department_start_idx` ON `projects` (`department_id`,`start_date`);--> statement-breakpoint
CREATE INDEX `projects_created_by_idx` ON `projects` (`created_by`);--> statement-breakpoint
CREATE INDEX `projects_deleted_idx` ON `projects` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `task_assignees_user_task_idx` ON `task_assignees` (`user_id`,`task_id`);--> statement-breakpoint
CREATE INDEX `tasks_project_status_idx` ON `tasks` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_milestone_order_idx` ON `tasks` (`milestone_id`,`display_order`);--> statement-breakpoint
CREATE INDEX `tasks_parent_idx` ON `tasks` (`parent_id`);--> statement-breakpoint
CREATE INDEX `tasks_due_date_idx` ON `tasks` (`due_date`);--> statement-breakpoint
CREATE INDEX `tasks_category_idx` ON `tasks` (`category_id`);--> statement-breakpoint
CREATE INDEX `attachments_task_idx` ON `attachments` (`task_id`);--> statement-breakpoint
CREATE INDEX `attachments_comment_idx` ON `attachments` (`comment_id`);--> statement-breakpoint
CREATE INDEX `attachments_uploaded_by_idx` ON `attachments` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `comments_task_created_idx` ON `comments` (`task_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_user_idx` ON `comments` (`user_id`);--> statement-breakpoint
CREATE INDEX `device_tokens_user_idx` ON `device_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_created_idx` ON `notifications` (`recipient_id`,`is_read`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_performed_by_idx` ON `audit_logs` (`performed_by`);--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_correlation_idx` ON `audit_logs` (`correlation_id`);--> statement-breakpoint
CREATE INDEX `outbox_events_status_available_created_idx` ON `outbox_events` (`status`,`available_at`,`created_at`);--> statement-breakpoint
CREATE INDEX `outbox_events_aggregate_idx` ON `outbox_events` (`aggregate_type`,`aggregate_id`);