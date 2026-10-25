-- The chat's emoji: images in the database, one per supporter. By hand like 0038+.
CREATE TABLE `emoji` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL,
	`unicode` varchar(16),
	`owner_id` int,
	`shared` boolean NOT NULL DEFAULT false,
	`type` varchar(32) NOT NULL,
	`image` mediumblob NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emoji_id` PRIMARY KEY(`id`),
	CONSTRAINT `emoji_name_unique` UNIQUE(`name`),
	CONSTRAINT `emoji_owner_id_unique` UNIQUE(`owner_id`)
);
--> statement-breakpoint
ALTER TABLE `emoji` ADD CONSTRAINT `emoji_owner_id_user_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
