-- The 7K and osu!standard scaffolds' own tables, empty: those rulesets play on dev only.
-- Generated from the table builders (drizzle-kit's API), then the unranked ids' start as 0090.
CREATE TABLE `mania7k_score` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`divine` int NOT NULL DEFAULT 0,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `mania7k_score_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_best` (
	`id` int NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`divine` int NOT NULL DEFAULT 0,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `mania7k_best_character_id_beatmap_id_pk` PRIMARY KEY(`character_id`,`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_best_pp` (
	`id` int NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`divine` int NOT NULL DEFAULT 0,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `mania7k_best_pp_character_id_beatmap_id_pk` PRIMARY KEY(`character_id`,`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_unranked_score` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`divine` int NOT NULL DEFAULT 0,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `mania7k_unranked_score_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_first_place` (
	`id` int NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`divine` int NOT NULL DEFAULT 0,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `mania7k_first_place_beatmap_id_pk` PRIMARY KEY(`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_character_totals` (
	`id` int NOT NULL,
	`total_score` bigint NOT NULL DEFAULT 0,
	`ranked_score` bigint NOT NULL DEFAULT 0,
	`hits` bigint NOT NULL DEFAULT 0,
	`play_count` bigint NOT NULL DEFAULT 0,
	`play_time` bigint NOT NULL DEFAULT 0,
	`divine` bigint NOT NULL DEFAULT 0,
	`marvelous` bigint NOT NULL DEFAULT 0,
	`perfect` bigint NOT NULL DEFAULT 0,
	`great` bigint NOT NULL DEFAULT 0,
	`good` bigint NOT NULL DEFAULT 0,
	`bad` bigint NOT NULL DEFAULT 0,
	`miss` bigint NOT NULL DEFAULT 0,
	`xx` bigint NOT NULL DEFAULT 0,
	`x` bigint NOT NULL DEFAULT 0,
	`ss` bigint NOT NULL DEFAULT 0,
	`s` bigint NOT NULL DEFAULT 0,
	`a` bigint NOT NULL DEFAULT 0,
	`b` bigint NOT NULL DEFAULT 0,
	`c` bigint NOT NULL DEFAULT 0,
	`d` bigint NOT NULL DEFAULT 0,
	`f` bigint NOT NULL DEFAULT 0
);

--> statement-breakpoint
CREATE TABLE `mania7k_character_progress` (
	`character_id` int NOT NULL,
	`line` varchar(16) NOT NULL,
	`value` double NOT NULL,
	`current` double NOT NULL DEFAULT 0,
	CONSTRAINT `mania7k_character_progress_character_id_line_pk` PRIMARY KEY(`character_id`,`line`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_character_medal` (
	`character_id` int NOT NULL,
	`medal_id` varchar(32) NOT NULL,
	`unlocked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mania7k_character_medal_character_id_medal_id_pk` PRIMARY KEY(`character_id`,`medal_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_skill_milestone` (
	`character_id` int NOT NULL,
	`skill` varchar(32) NOT NULL,
	`level` int NOT NULL,
	CONSTRAINT `mania7k_skill_milestone_character_id_skill_pk` PRIMARY KEY(`character_id`,`skill`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_beatmaps_played` (
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`plays` int NOT NULL DEFAULT 0,
	`memory` int NOT NULL DEFAULT 0,
	CONSTRAINT `mania7k_beatmaps_played_character_id_beatmap_id_pk` PRIMARY KEY(`character_id`,`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_mp_game_score` (
	`game_id` int NOT NULL,
	`character_id` int NOT NULL,
	`score` int NOT NULL,
	`max_combo` int NOT NULL,
	`accuracy` decimal(10,8) NOT NULL,
	`failed` boolean NOT NULL,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL DEFAULT 'D',
	`divine` int NOT NULL DEFAULT 0,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	CONSTRAINT `mania7k_mp_game_score_game_id_character_id_pk` PRIMARY KEY(`game_id`,`character_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_character` (
	`id` int NOT NULL,
	`accuracy_level` int NOT NULL DEFAULT 0,
	`accuracy_xp` bigint NOT NULL DEFAULT 0,
	`accuracy_total_xp` bigint NOT NULL DEFAULT 0,
	`accuracy_lifetime_xp` bigint NOT NULL DEFAULT 0,
	`accuracy_upgrades` int NOT NULL DEFAULT 0,
	`accuracy_prestige` int NOT NULL DEFAULT 0,
	`accuracy_overdrive` double NOT NULL DEFAULT 0,
	`overall_level` int NOT NULL DEFAULT 0,
	`overall_xp` bigint NOT NULL DEFAULT 0,
	`overall_total_xp` bigint NOT NULL DEFAULT 0,
	`overall_lifetime_xp` bigint NOT NULL DEFAULT 0,
	`generation` int NOT NULL DEFAULT 1,
	`upgrades_bought` int NOT NULL DEFAULT 0,
	`ladders_completed` int NOT NULL DEFAULT 0,
	`pp` decimal(10,3) NOT NULL DEFAULT '0',
	`rank_history` json,
	`fatigue` json,
	CONSTRAINT `mania7k_character_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_beatmapset_status` (
	`set_id` int NOT NULL,
	`status` enum('pending','ranked','rejected','unranked','loved') NOT NULL DEFAULT 'pending',
	`ranked_at` timestamp,
	`announced` boolean NOT NULL DEFAULT false,
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`leaderboard` boolean NOT NULL DEFAULT false,
	`review_note` text,
	CONSTRAINT `mania7k_beatmapset_status_set_id` PRIMARY KEY(`set_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_beatmap_request` (
	`set_id` int NOT NULL,
	`user_id` int NOT NULL,
	`artist` text NOT NULL,
	`title` text NOT NULL,
	`creator` text NOT NULL,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	`resolved_by` int,
	CONSTRAINT `mania7k_beatmap_request_set_id` PRIMARY KEY(`set_id`)
);

--> statement-breakpoint
CREATE TABLE `mania7k_beatmap_request_vote` (
	`set_id` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mania7k_beatmap_request_vote_set_id_user_id_pk` PRIMARY KEY(`set_id`,`user_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_score` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`great` int NOT NULL DEFAULT 0,
	`ok` int NOT NULL DEFAULT 0,
	`meh` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `osu_score_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `osu_best` (
	`id` int NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`great` int NOT NULL DEFAULT 0,
	`ok` int NOT NULL DEFAULT 0,
	`meh` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `osu_best_character_id_beatmap_id_pk` PRIMARY KEY(`character_id`,`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_best_pp` (
	`id` int NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`great` int NOT NULL DEFAULT 0,
	`ok` int NOT NULL DEFAULT 0,
	`meh` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `osu_best_pp_character_id_beatmap_id_pk` PRIMARY KEY(`character_id`,`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_unranked_score` (
	`id` int AUTO_INCREMENT NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`great` int NOT NULL DEFAULT 0,
	`ok` int NOT NULL DEFAULT 0,
	`meh` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `osu_unranked_score_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `osu_first_place` (
	`id` int NOT NULL,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`great` int NOT NULL DEFAULT 0,
	`ok` int NOT NULL DEFAULT 0,
	`meh` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT '1.00',
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `osu_first_place_beatmap_id_pk` PRIMARY KEY(`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_character_totals` (
	`id` int NOT NULL,
	`total_score` bigint NOT NULL DEFAULT 0,
	`ranked_score` bigint NOT NULL DEFAULT 0,
	`hits` bigint NOT NULL DEFAULT 0,
	`play_count` bigint NOT NULL DEFAULT 0,
	`play_time` bigint NOT NULL DEFAULT 0,
	`great` bigint NOT NULL DEFAULT 0,
	`ok` bigint NOT NULL DEFAULT 0,
	`meh` bigint NOT NULL DEFAULT 0,
	`miss` bigint NOT NULL DEFAULT 0,
	`xx` bigint NOT NULL DEFAULT 0,
	`x` bigint NOT NULL DEFAULT 0,
	`ss` bigint NOT NULL DEFAULT 0,
	`s` bigint NOT NULL DEFAULT 0,
	`a` bigint NOT NULL DEFAULT 0,
	`b` bigint NOT NULL DEFAULT 0,
	`c` bigint NOT NULL DEFAULT 0,
	`d` bigint NOT NULL DEFAULT 0,
	`f` bigint NOT NULL DEFAULT 0
);

--> statement-breakpoint
CREATE TABLE `osu_character_progress` (
	`character_id` int NOT NULL,
	`line` varchar(16) NOT NULL,
	`value` double NOT NULL,
	`current` double NOT NULL DEFAULT 0,
	CONSTRAINT `osu_character_progress_character_id_line_pk` PRIMARY KEY(`character_id`,`line`)
);

--> statement-breakpoint
CREATE TABLE `osu_character_medal` (
	`character_id` int NOT NULL,
	`medal_id` varchar(32) NOT NULL,
	`unlocked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osu_character_medal_character_id_medal_id_pk` PRIMARY KEY(`character_id`,`medal_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_skill_milestone` (
	`character_id` int NOT NULL,
	`skill` varchar(32) NOT NULL,
	`level` int NOT NULL,
	CONSTRAINT `osu_skill_milestone_character_id_skill_pk` PRIMARY KEY(`character_id`,`skill`)
);

--> statement-breakpoint
CREATE TABLE `osu_beatmaps_played` (
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`plays` int NOT NULL DEFAULT 0,
	`memory` int NOT NULL DEFAULT 0,
	CONSTRAINT `osu_beatmaps_played_character_id_beatmap_id_pk` PRIMARY KEY(`character_id`,`beatmap_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_mp_game_score` (
	`game_id` int NOT NULL,
	`character_id` int NOT NULL,
	`score` int NOT NULL,
	`max_combo` int NOT NULL,
	`accuracy` decimal(10,8) NOT NULL,
	`failed` boolean NOT NULL,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL DEFAULT 'D',
	`great` int NOT NULL DEFAULT 0,
	`ok` int NOT NULL DEFAULT 0,
	`meh` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	CONSTRAINT `osu_mp_game_score_game_id_character_id_pk` PRIMARY KEY(`game_id`,`character_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_character` (
	`id` int NOT NULL,
	`accuracy_level` int NOT NULL DEFAULT 0,
	`accuracy_xp` bigint NOT NULL DEFAULT 0,
	`accuracy_total_xp` bigint NOT NULL DEFAULT 0,
	`accuracy_lifetime_xp` bigint NOT NULL DEFAULT 0,
	`accuracy_upgrades` int NOT NULL DEFAULT 0,
	`accuracy_prestige` int NOT NULL DEFAULT 0,
	`accuracy_overdrive` double NOT NULL DEFAULT 0,
	`overall_level` int NOT NULL DEFAULT 0,
	`overall_xp` bigint NOT NULL DEFAULT 0,
	`overall_total_xp` bigint NOT NULL DEFAULT 0,
	`overall_lifetime_xp` bigint NOT NULL DEFAULT 0,
	`generation` int NOT NULL DEFAULT 1,
	`upgrades_bought` int NOT NULL DEFAULT 0,
	`ladders_completed` int NOT NULL DEFAULT 0,
	`pp` decimal(10,3) NOT NULL DEFAULT '0',
	`rank_history` json,
	`fatigue` json,
	CONSTRAINT `osu_character_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `osu_beatmapset_status` (
	`set_id` int NOT NULL,
	`status` enum('pending','ranked','rejected','unranked','loved') NOT NULL DEFAULT 'pending',
	`ranked_at` timestamp,
	`announced` boolean NOT NULL DEFAULT false,
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`leaderboard` boolean NOT NULL DEFAULT false,
	`review_note` text,
	CONSTRAINT `osu_beatmapset_status_set_id` PRIMARY KEY(`set_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_beatmap_request` (
	`set_id` int NOT NULL,
	`user_id` int NOT NULL,
	`artist` text NOT NULL,
	`title` text NOT NULL,
	`creator` text NOT NULL,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`resolved_at` timestamp,
	`resolved_by` int,
	CONSTRAINT `osu_beatmap_request_set_id` PRIMARY KEY(`set_id`)
);

--> statement-breakpoint
CREATE TABLE `osu_beatmap_request_vote` (
	`set_id` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osu_beatmap_request_vote_set_id_user_id_pk` PRIMARY KEY(`set_id`,`user_id`)
);

--> statement-breakpoint
ALTER TABLE `mania7k_score` ADD CONSTRAINT `mania7k_score_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_best` ADD CONSTRAINT `mania7k_best_id_mania7k_score_id_fk` FOREIGN KEY (`id`) REFERENCES `mania7k_score`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_best` ADD CONSTRAINT `mania7k_best_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_best_pp` ADD CONSTRAINT `mania7k_best_pp_id_mania7k_score_id_fk` FOREIGN KEY (`id`) REFERENCES `mania7k_score`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_best_pp` ADD CONSTRAINT `mania7k_best_pp_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_unranked_score` ADD CONSTRAINT `mania7k_unranked_score_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_first_place` ADD CONSTRAINT `mania7k_first_place_id_mania7k_score_id_fk` FOREIGN KEY (`id`) REFERENCES `mania7k_score`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_first_place` ADD CONSTRAINT `mania7k_first_place_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_character_totals` ADD CONSTRAINT `mania7k_character_totals_id_character_id_fk` FOREIGN KEY (`id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_character_progress` ADD CONSTRAINT `mania7k_character_progress_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_character_medal` ADD CONSTRAINT `mania7k_character_medal_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_skill_milestone` ADD CONSTRAINT `mania7k_skill_milestone_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_beatmaps_played` ADD CONSTRAINT `mania7k_beatmaps_played_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_beatmaps_played` ADD CONSTRAINT `mania7k_beatmaps_played_beatmap_id_beatmap_id_fk` FOREIGN KEY (`beatmap_id`) REFERENCES `beatmap`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_mp_game_score` ADD CONSTRAINT `mania7k_mp_game_score_game_id_mp_game_id_fk` FOREIGN KEY (`game_id`) REFERENCES `mp_game`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_character` ADD CONSTRAINT `mania7k_character_id_character_id_fk` FOREIGN KEY (`id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `mania7k_beatmapset_status` ADD CONSTRAINT `mania7k_beatmapset_status_set_id_beatmapset_id_fk` FOREIGN KEY (`set_id`) REFERENCES `beatmapset`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_score` ADD CONSTRAINT `osu_score_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_best` ADD CONSTRAINT `osu_best_id_osu_score_id_fk` FOREIGN KEY (`id`) REFERENCES `osu_score`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_best` ADD CONSTRAINT `osu_best_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_best_pp` ADD CONSTRAINT `osu_best_pp_id_osu_score_id_fk` FOREIGN KEY (`id`) REFERENCES `osu_score`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_best_pp` ADD CONSTRAINT `osu_best_pp_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_unranked_score` ADD CONSTRAINT `osu_unranked_score_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_first_place` ADD CONSTRAINT `osu_first_place_id_osu_score_id_fk` FOREIGN KEY (`id`) REFERENCES `osu_score`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_first_place` ADD CONSTRAINT `osu_first_place_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_character_totals` ADD CONSTRAINT `osu_character_totals_id_character_id_fk` FOREIGN KEY (`id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_character_progress` ADD CONSTRAINT `osu_character_progress_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_character_medal` ADD CONSTRAINT `osu_character_medal_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_skill_milestone` ADD CONSTRAINT `osu_skill_milestone_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_beatmaps_played` ADD CONSTRAINT `osu_beatmaps_played_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_beatmaps_played` ADD CONSTRAINT `osu_beatmaps_played_beatmap_id_beatmap_id_fk` FOREIGN KEY (`beatmap_id`) REFERENCES `beatmap`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_mp_game_score` ADD CONSTRAINT `osu_mp_game_score_game_id_mp_game_id_fk` FOREIGN KEY (`game_id`) REFERENCES `mp_game`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_character` ADD CONSTRAINT `osu_character_id_character_id_fk` FOREIGN KEY (`id`) REFERENCES `character`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `osu_beatmapset_status` ADD CONSTRAINT `osu_beatmapset_status_set_id_beatmapset_id_fk` FOREIGN KEY (`set_id`) REFERENCES `beatmapset`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `character_beatmap_idx` ON `mania7k_score` (`character_id`,`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `beatmap_idx` ON `mania7k_score` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `character_playedat_idx` ON `mania7k_score` (`character_id`,`played_at`);
--> statement-breakpoint
CREATE INDEX `beatmap_idx` ON `mania7k_best` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `beatmap_idx` ON `mania7k_best_pp` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `pp_idx` ON `mania7k_best_pp` (`pp`,`id`);
--> statement-breakpoint
CREATE INDEX `unranked_score_beatmap_idx` ON `mania7k_unranked_score` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `character_beatmap_idx` ON `osu_score` (`character_id`,`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `beatmap_idx` ON `osu_score` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `character_playedat_idx` ON `osu_score` (`character_id`,`played_at`);
--> statement-breakpoint
CREATE INDEX `beatmap_idx` ON `osu_best` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `beatmap_idx` ON `osu_best_pp` (`beatmap_id`);
--> statement-breakpoint
CREATE INDEX `pp_idx` ON `osu_best_pp` (`pp`,`id`);
--> statement-breakpoint
CREATE INDEX `unranked_score_beatmap_idx` ON `osu_unranked_score` (`beatmap_id`);
--> statement-breakpoint
ALTER TABLE `mania7k_unranked_score` AUTO_INCREMENT = 1500000000;
--> statement-breakpoint
ALTER TABLE `osu_unranked_score` AUTO_INCREMENT = 1500000000;
