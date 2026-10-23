-- Bug reports from the game's options, answered from /web/admin/bugs. By hand like 0038+.
CREATE TABLE `bug_report` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`status` enum('open','confirmed','fixed','closed') NOT NULL DEFAULT 'open',
	`version` varchar(32) NOT NULL,
	`client` varchar(500) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`reporter_seen` int NOT NULL DEFAULT 0,
	CONSTRAINT `bug_report_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bug_report` ADD CONSTRAINT `bug_report_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE `bug_report_message` (
	`id` int AUTO_INCREMENT NOT NULL,
	`report_id` int NOT NULL,
	`author_id` int NOT NULL,
	`body` text NOT NULL,
	`images` json NOT NULL,
	`status` enum('open','confirmed','fixed','closed'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bug_report_message_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bug_report_message` ADD CONSTRAINT `bug_report_message_report_id_bug_report_id_fk` FOREIGN KEY (`report_id`) REFERENCES `bug_report`(`id`) ON DELETE cascade ON UPDATE no action;
