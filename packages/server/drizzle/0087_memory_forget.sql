-- Memory upgrades forget 10 plays on every map: the ones already bought forget theirs now.
UPDATE `beatmaps_played` `bp`
	INNER JOIN `character` `c` ON `c`.`id` = `bp`.`character_id`
	SET `bp`.`memory` = GREATEST(CAST(`bp`.`memory` AS SIGNED) - 10 * `c`.`memory_upgrades`, 0)
	WHERE `c`.`memory_upgrades` > 0;
