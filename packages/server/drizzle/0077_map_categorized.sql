-- A set whose tags were reviewed on the nomination page. By hand like 0038+.
ALTER TABLE `beatmapset` ADD `categorized` boolean NOT NULL DEFAULT false;
