-- Each chart's sha256 without its BOM, for the game to see its copy is outdated. By hand like 0038+.
ALTER TABLE `beatmap` ADD `checksum` char(64) GENERATED ALWAYS AS (sha2(trim(leading convert(unhex('EFBBBF') using utf8mb4) from `chart`), 256)) STORED;
