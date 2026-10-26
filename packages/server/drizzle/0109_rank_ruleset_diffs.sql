-- A difficulty some ruleset plays is ranked, as ingest decides since 33a400c9: 0032 and the
-- ingests before it left 7K's unranked. 4K's stay as they are (admins unrank those by hand).
-- By hand like 0038+.
UPDATE `beatmap` SET `ranked` = true WHERE `ranked` = false AND `mode` = 3 AND `keys` = 7;
