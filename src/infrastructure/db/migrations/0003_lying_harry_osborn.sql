UPDATE `tasks` SET `status` = 'completed' WHERE `status` = 'done';--> statement-breakpoint
UPDATE `tasks` SET `status` = 'pending' WHERE `status` = 'todo';--> statement-breakpoint
UPDATE `tasks` SET `status` = 'in_progress' WHERE `status` = 'review';--> statement-breakpoint
UPDATE `tasks` SET `status` = 'cancelled' WHERE `status` = 'blocked';--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `priority` enum('low','medium','high');
