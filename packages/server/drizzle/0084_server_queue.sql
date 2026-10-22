-- The play queue's preferences move to the server, per character. Existing characters keep
-- the old default (Playlist); new ones get Next song. By hand like 0038+.
ALTER TABLE `character` ADD COLUMN IF NOT EXISTS `autopilot_mode` varchar(10) DEFAULT 'PLAYLIST' NOT NULL;
--> statement-breakpoint
ALTER TABLE `character` ALTER COLUMN `autopilot_mode` SET DEFAULT 'NEXT';
--> statement-breakpoint
ALTER TABLE `character` ADD COLUMN IF NOT EXISTS `autopilot_delay` int DEFAULT 30 NOT NULL;
--> statement-breakpoint
ALTER TABLE `character` ADD COLUMN IF NOT EXISTS `play_rate` double DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `character` ADD COLUMN IF NOT EXISTS `play_mods` json;
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `keep_playing` boolean DEFAULT true NOT NULL;
