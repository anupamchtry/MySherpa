CREATE TABLE `warnings` (
	`id` text PRIMARY KEY NOT NULL,
	`client_report_id` text NOT NULL,
	`trek_id` text NOT NULL,
	`status` text NOT NULL,
	`severity` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warnings_client_report_id_unique` ON `warnings` (`client_report_id`);
--> statement-breakpoint
CREATE INDEX `idx_warnings_trek_status` ON `warnings` (`trek_id`,`status`);
--> statement-breakpoint
CREATE INDEX `idx_warnings_updated_at` ON `warnings` (`updated_at`);
--> statement-breakpoint
PRAGMA optimize;
