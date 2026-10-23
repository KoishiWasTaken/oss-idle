-- What an add-on is for: gameplay (the default) and/or editor, comma-separated. By hand like 0038+.
ALTER TABLE `addons` ADD COLUMN IF NOT EXISTS `types` varchar(32) NOT NULL DEFAULT 'gameplay';
