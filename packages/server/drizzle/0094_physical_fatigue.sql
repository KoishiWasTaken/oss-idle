-- How long each physical skill has been strained, decaying with rest (server fatigue.ts). By hand like 0038+.
ALTER TABLE `character` ADD COLUMN IF NOT EXISTS `fatigue` json;
