-- A player's unranked map has a leaderboard for good once a supporter uploads or plays
-- it. Its scores are not ranked (no pp, no XP), kept apart from `score`, and wiped on
-- every update and on ranking. Ids start far past `score`'s so a client never mixes
-- the two up. By hand like 0038+.
ALTER TABLE `beatmapset` ADD `leaderboard` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE `unranked_score` (
	`id` int NOT NULL AUTO_INCREMENT,
	`character_id` int NOT NULL,
	`beatmap_id` int NOT NULL,
	`score` int NOT NULL,
	`accuracy` decimal(10,5) NOT NULL,
	`max_combo` int NOT NULL,
	`marvelous` int NOT NULL DEFAULT 0,
	`perfect` int NOT NULL DEFAULT 0,
	`great` int NOT NULL DEFAULT 0,
	`good` int NOT NULL DEFAULT 0,
	`bad` int NOT NULL DEFAULT 0,
	`miss` int NOT NULL DEFAULT 0,
	`divine` int NOT NULL DEFAULT 0,
	`grade` enum('XX','X','SS','S','A','B','C','D','F') NOT NULL,
	`pp` decimal(10,3) NOT NULL DEFAULT 0,
	`ur` decimal(10,3) NOT NULL,
	`pfc` boolean NOT NULL,
	`played_at` timestamp DEFAULT (now()),
	`rate` decimal(3,2) NOT NULL DEFAULT 1.00,
	`sr` decimal(10,3),
	`mods` varchar(16) NOT NULL DEFAULT '',
	CONSTRAINT `unranked_score_id` PRIMARY KEY(`id`),
	CONSTRAINT `unranked_score_character_id_character_id_fk` FOREIGN KEY (`character_id`) REFERENCES `character`(`id`) ON DELETE cascade
) AUTO_INCREMENT = 1500000000;
--> statement-breakpoint
CREATE INDEX `unranked_score_beatmap_idx` ON `unranked_score` (`beatmap_id`);
