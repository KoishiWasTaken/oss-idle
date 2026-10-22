-- Map tags set by hand from the nomination page: SV/LN per difficulty, bundled per set. By hand like 0038+.
ALTER TABLE `beatmap` ADD `tags` varchar(64) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `beatmapset` ADD `bundled` boolean NOT NULL DEFAULT true;
