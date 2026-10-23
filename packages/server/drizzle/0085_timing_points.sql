-- Red (bpm) and green (sv) line counts of each difficulty, shown when tagging it.
ALTER TABLE `beatmap` ADD `bpm_points` int;
--> statement-breakpoint
ALTER TABLE `beatmap` ADD `sv_points` int;
