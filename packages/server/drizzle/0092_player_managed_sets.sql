-- A set players manage carries `uploaded_at`: their own uploads, now with or without an
-- osu! id, and a map from osu! its mapper took over. It replaces "owned with no osu!
-- id" as the test for a player's map. By hand like 0038+.
ALTER TABLE `beatmapset` ADD `uploaded_at` timestamp;
--> statement-breakpoint
UPDATE `beatmapset` SET `uploaded_at` = `created_at` WHERE `owner_user_id` IS NOT NULL AND `osu_id` IS NULL;
