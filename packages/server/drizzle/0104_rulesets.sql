-- Rulesets: today's progression and scores become mania 4K's own tables (`mania4k_*`).
-- The character keeps who it is and the ruleset it picked. By hand like 0038+.
RENAME TABLE `score` TO `mania4k_score`,
	`best` TO `mania4k_best`,
	`best_pp` TO `mania4k_best_pp`,
	`unranked_score` TO `mania4k_unranked_score`,
	`first_place` TO `mania4k_first_place`,
	`character_totals` TO `mania4k_character_totals`,
	`character_progress` TO `mania4k_character_progress`,
	`character_medal` TO `mania4k_character_medal`,
	`skill_milestone` TO `mania4k_skill_milestone`,
	`beatmaps_played` TO `mania4k_beatmaps_played`,
	`mp_game_score` TO `mania4k_mp_game_score`;
--> statement-breakpoint
CREATE TABLE `mania4k_character` LIKE `character`;
--> statement-breakpoint
INSERT INTO `mania4k_character` SELECT * FROM `character`;
--> statement-breakpoint
ALTER TABLE `mania4k_character`
	DROP INDEX `character_name_unique`,
	DROP INDEX `character_user_id_user_id_fk`,
	MODIFY `id` int(11) NOT NULL,
	DROP COLUMN `user_id`,
	DROP COLUMN `name`,
	DROP COLUMN `avatar_url`,
	DROP COLUMN `banner_url`,
	DROP COLUMN `title`,
	DROP COLUMN `user_page`,
	DROP COLUMN `profile_order`,
	DROP COLUMN `pending_action`,
	DROP COLUMN `autopilot_mode`,
	DROP COLUMN `autopilot_delay`,
	DROP COLUMN `play_rate`,
	DROP COLUMN `play_mods`;
--> statement-breakpoint
ALTER TABLE `mania4k_character` ADD CONSTRAINT `mania4k_character_id_character_id_fk` FOREIGN KEY (`id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `character`
	DROP COLUMN `accuracy_level`,
	DROP COLUMN `accuracy_xp`,
	DROP COLUMN `accuracy_total_xp`,
	DROP COLUMN `accuracy_lifetime_xp`,
	DROP COLUMN `accuracy_upgrades`,
	DROP COLUMN `accuracy_prestige`,
	DROP COLUMN `accuracy_overdrive`,
	DROP COLUMN `speed_level`,
	DROP COLUMN `speed_xp`,
	DROP COLUMN `speed_total_xp`,
	DROP COLUMN `speed_lifetime_xp`,
	DROP COLUMN `speed_upgrades`,
	DROP COLUMN `speed_prestige`,
	DROP COLUMN `speed_overdrive`,
	DROP COLUMN `stamina_level`,
	DROP COLUMN `stamina_xp`,
	DROP COLUMN `stamina_total_xp`,
	DROP COLUMN `stamina_lifetime_xp`,
	DROP COLUMN `stamina_upgrades`,
	DROP COLUMN `stamina_prestige`,
	DROP COLUMN `stamina_overdrive`,
	DROP COLUMN `jackspeed_level`,
	DROP COLUMN `jackspeed_xp`,
	DROP COLUMN `jackspeed_total_xp`,
	DROP COLUMN `jackspeed_lifetime_xp`,
	DROP COLUMN `jackspeed_upgrades`,
	DROP COLUMN `jackspeed_prestige`,
	DROP COLUMN `jackspeed_overdrive`,
	DROP COLUMN `coordination_level`,
	DROP COLUMN `coordination_xp`,
	DROP COLUMN `coordination_total_xp`,
	DROP COLUMN `coordination_lifetime_xp`,
	DROP COLUMN `coordination_upgrades`,
	DROP COLUMN `coordination_prestige`,
	DROP COLUMN `coordination_overdrive`,
	DROP COLUMN `release_level`,
	DROP COLUMN `release_xp`,
	DROP COLUMN `release_total_xp`,
	DROP COLUMN `release_lifetime_xp`,
	DROP COLUMN `release_upgrades`,
	DROP COLUMN `release_prestige`,
	DROP COLUMN `release_overdrive`,
	DROP COLUMN `reading_level`,
	DROP COLUMN `reading_xp`,
	DROP COLUMN `reading_total_xp`,
	DROP COLUMN `reading_lifetime_xp`,
	DROP COLUMN `reading_upgrades`,
	DROP COLUMN `reading_prestige`,
	DROP COLUMN `reading_overdrive`,
	DROP COLUMN `consistency_level`,
	DROP COLUMN `consistency_xp`,
	DROP COLUMN `consistency_total_xp`,
	DROP COLUMN `consistency_lifetime_xp`,
	DROP COLUMN `consistency_upgrades`,
	DROP COLUMN `consistency_prestige`,
	DROP COLUMN `consistency_overdrive`,
	DROP COLUMN `concentration_level`,
	DROP COLUMN `concentration_xp`,
	DROP COLUMN `concentration_total_xp`,
	DROP COLUMN `concentration_lifetime_xp`,
	DROP COLUMN `concentration_upgrades`,
	DROP COLUMN `concentration_prestige`,
	DROP COLUMN `concentration_overdrive`,
	DROP COLUMN `speedjam_level`,
	DROP COLUMN `speedjam_xp`,
	DROP COLUMN `speedjam_total_xp`,
	DROP COLUMN `speedjam_lifetime_xp`,
	DROP COLUMN `speedjam_upgrades`,
	DROP COLUMN `speedjam_prestige`,
	DROP COLUMN `speedjam_overdrive`,
	DROP COLUMN `memory_level`,
	DROP COLUMN `memory_xp`,
	DROP COLUMN `memory_total_xp`,
	DROP COLUMN `memory_lifetime_xp`,
	DROP COLUMN `memory_upgrades`,
	DROP COLUMN `memory_prestige`,
	DROP COLUMN `memory_overdrive`,
	DROP COLUMN `overall_level`,
	DROP COLUMN `overall_xp`,
	DROP COLUMN `overall_total_xp`,
	DROP COLUMN `overall_lifetime_xp`,
	DROP COLUMN `generation`,
	DROP COLUMN `upgrades_bought`,
	DROP COLUMN `ladders_completed`,
	DROP COLUMN `pp`,
	DROP COLUMN `rank_history`,
	DROP COLUMN `fatigue`,
	ADD `ruleset` varchar(16) NOT NULL DEFAULT 'mania4k',
	ADD `ruleset_lock` varchar(16);
--> statement-breakpoint
-- every rebirth so far was 4K's: a reborn character stays there
UPDATE `character` c JOIN `mania4k_character` p ON p.id = c.id SET c.`ruleset_lock` = 'mania4k' WHERE p.generation > 1;
--> statement-breakpoint
-- a parked purchase was bought in 4K: the only ruleset there was
UPDATE `character` SET `pending_action` = REPLACE(`pending_action`, '{"type":', '{"ruleset":"mania4k","type":') WHERE `pending_action` IS NOT NULL;
--> statement-breakpoint
ALTER TABLE `mp_game` ADD `ruleset` varchar(16) NOT NULL DEFAULT 'mania4k';
--> statement-breakpoint
-- a set's status is per ruleset: today's is 4K's
CREATE TABLE `mania4k_beatmapset_status` (
	`set_id` int(11) NOT NULL,
	`status` enum('pending','ranked','rejected','unranked','loved') NOT NULL DEFAULT 'pending',
	`ranked_at` timestamp NULL DEFAULT NULL,
	`announced` tinyint(1) NOT NULL DEFAULT 0,
	`submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
	`leaderboard` tinyint(1) NOT NULL DEFAULT 0,
	`review_note` text DEFAULT NULL,
	PRIMARY KEY (`set_id`),
	CONSTRAINT `mania4k_beatmapset_status_set_id_beatmapset_id_fk` FOREIGN KEY (`set_id`) REFERENCES `beatmapset`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
INSERT INTO `mania4k_beatmapset_status` (`set_id`, `status`, `ranked_at`, `announced`, `submitted_at`, `leaderboard`, `review_note`)
	SELECT `id`, `status`, `ranked_at`, `announced`, `submitted_at`, `leaderboard`, `review_note` FROM `beatmapset`;
--> statement-breakpoint
ALTER TABLE `beatmapset`
	DROP COLUMN `status`,
	DROP COLUMN `ranked_at`,
	DROP COLUMN `announced`,
	DROP COLUMN `submitted_at`,
	DROP COLUMN `leaderboard`,
	DROP COLUMN `review_note`;
--> statement-breakpoint
RENAME TABLE `beatmap_request` TO `mania4k_beatmap_request`,
	`beatmap_request_vote` TO `mania4k_beatmap_request_vote`;
