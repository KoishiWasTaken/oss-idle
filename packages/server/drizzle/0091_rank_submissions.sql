-- Players submit their unranked maps for rank: an admin can send one back with a
-- reason. `created_at` dates the upload itself (the monthly quota counts it), now that
-- `submitted_at` moves when a map enters the queue. By hand like 0038+.
ALTER TABLE `beatmapset` ADD `review_note` text;
--> statement-breakpoint
ALTER TABLE `beatmapset` ADD `created_at` timestamp NOT NULL DEFAULT (now());
--> statement-breakpoint
-- every set already here came from the team, none from a player's upload: dated before
-- uploads were possible, so a mapper unranking one is not counted a new upload this month
UPDATE `beatmapset` SET `created_at` = '2026-01-01 00:00:00';
