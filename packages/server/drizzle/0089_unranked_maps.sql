-- Players upload their own maps: an `unranked` set is public, owned by the player who
-- uploaded it, and only that player can replace it. By hand like 0038+.
ALTER TABLE `beatmapset` MODIFY `status` enum('pending','ranked','rejected','unranked') NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE `beatmapset` ADD `owner_user_id` int;
--> statement-breakpoint
CREATE INDEX `beatmapset_owner_idx` ON `beatmapset` (`owner_user_id`);
