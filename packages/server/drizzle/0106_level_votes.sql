-- Level calibration: difficulties players vote skill levels on, per ruleset. By hand like 0038+.
CREATE TABLE `mania4k_level_map` (
	`beatmap_id` int NOT NULL,
	`disabled` varchar(255) NOT NULL DEFAULT '',
	`target` varchar(64) NOT NULL DEFAULT '',
	`added_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mania4k_level_map_beatmap_id` PRIMARY KEY(`beatmap_id`)
);
--> statement-breakpoint
CREATE TABLE `mania4k_level_vote` (
	`beatmap_id` int NOT NULL,
	`user_id` int NOT NULL,
	`skill` varchar(32) NOT NULL,
	`level` int NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mania4k_level_vote_beatmap_id_user_id_skill_pk` PRIMARY KEY(`beatmap_id`,`user_id`,`skill`)
);
--> statement-breakpoint
CREATE TABLE `mania7k_level_map` (
	`beatmap_id` int NOT NULL,
	`disabled` varchar(255) NOT NULL DEFAULT '',
	`target` varchar(64) NOT NULL DEFAULT '',
	`added_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mania7k_level_map_beatmap_id` PRIMARY KEY(`beatmap_id`)
);
--> statement-breakpoint
CREATE TABLE `mania7k_level_vote` (
	`beatmap_id` int NOT NULL,
	`user_id` int NOT NULL,
	`skill` varchar(32) NOT NULL,
	`level` int NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mania7k_level_vote_beatmap_id_user_id_skill_pk` PRIMARY KEY(`beatmap_id`,`user_id`,`skill`)
);
--> statement-breakpoint
CREATE TABLE `osu_level_map` (
	`beatmap_id` int NOT NULL,
	`disabled` varchar(255) NOT NULL DEFAULT '',
	`target` varchar(64) NOT NULL DEFAULT '',
	`added_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osu_level_map_beatmap_id` PRIMARY KEY(`beatmap_id`)
);
--> statement-breakpoint
CREATE TABLE `osu_level_vote` (
	`beatmap_id` int NOT NULL,
	`user_id` int NOT NULL,
	`skill` varchar(32) NOT NULL,
	`level` int NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `osu_level_vote_beatmap_id_user_id_skill_pk` PRIMARY KEY(`beatmap_id`,`user_id`,`skill`)
);
