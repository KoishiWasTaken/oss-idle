-- A play's mods (EZ, NF, HR, SD, PF), comma-separated in mod select order. By hand like 0038+.
ALTER TABLE `score` ADD `mods` varchar(16) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `best` ADD `mods` varchar(16) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `best_pp` ADD `mods` varchar(16) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `first_place` ADD `mods` varchar(16) NOT NULL DEFAULT '';
