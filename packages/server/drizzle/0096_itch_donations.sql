-- itch.io purchases of oss!idle claimed as supporter from the website's settings. By hand like 0038+.
CREATE TABLE `itch_donation` (
	`purchase_id` int NOT NULL,
	`user_id` int,
	`itch_user_id` int NOT NULL,
	`price` varchar(32) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`amount` int NOT NULL,
	`seconds` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `itch_donation_purchase_id` PRIMARY KEY(`purchase_id`)
);
--> statement-breakpoint
ALTER TABLE `itch_donation` ADD CONSTRAINT `itch_donation_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;
