-- Add-ons built from a public git repository, next to the inline ones. By hand like 0038+.
ALTER TABLE `addons` ADD `kind` varchar(10) DEFAULT 'inline' NOT NULL;
--> statement-breakpoint
ALTER TABLE `addons` ADD `repo_url` varchar(512);
--> statement-breakpoint
ALTER TABLE `addons` ADD `hook_secret` varchar(64);
--> statement-breakpoint
ALTER TABLE `addons` ADD `trusted` boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `addons` ADD `commit` varchar(40);
--> statement-breakpoint
ALTER TABLE `addons` ADD `tag` varchar(100);
--> statement-breakpoint
ALTER TABLE `addons` ADD `published_commit` varchar(40);
--> statement-breakpoint
ALTER TABLE `addons` ADD `published_tag` varchar(100);
--> statement-breakpoint
ALTER TABLE `addons` ADD `source_diff` longtext;
--> statement-breakpoint
ALTER TABLE `addons` ADD `build_status` varchar(10) DEFAULT 'idle' NOT NULL;
--> statement-breakpoint
ALTER TABLE `addons` ADD `build_log` mediumtext;
--> statement-breakpoint
ALTER TABLE `addons` ADD `build_at` timestamp NULL;
