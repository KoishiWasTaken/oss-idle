-- A delete by set scanned and locked every beatmap row, deadlocking uploads with play totals. By hand like 0038+.
CREATE INDEX `beatmap_set_idx` ON `beatmap` (`set_id`);
