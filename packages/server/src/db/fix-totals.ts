/**
 * Put every character's totals back in step with its scores and bests.
 *
 * Totals used to be kept up by each play (+ the score, - the best it beat). A
 * submit that saved the best but not the totals left them short for good, and the
 * next better play took off a best they never had: counts went below zero. They
 * are recomputed from the scores now; this fixes the rows written before.
 *
 *   npm -w @oss-idle/server run fix:totals:prod -- --dry-run [--ruleset mania4k]
 */
import { eq } from 'drizzle-orm';

import { reindexCharacter } from '../rankings';
import {
	loadRulesets,
	rulesetFromArgs,
} from '../rulesets/registry';
import { db } from './client';
import {
	type CharacterTotalsRow,
	refreshCharacterTotals,
} from './schema/character_totals';

const dryRun = process.argv.includes('--dry-run');

class DryRun extends Error {}

const changes = (before: CharacterTotalsRow, after: CharacterTotalsRow): string[] =>
	(Object.keys(after) as (keyof CharacterTotalsRow)[])
		.filter(k => before[k] !== after[k])
		.map(k => `${k} ${before[k]} -> ${after[k]}`);

const main = async () => {
	await loadRulesets();
	const r = rulesetFromArgs();
	const { totals: character_totals } = r;
	const ids = (await db.select({ id: character_totals.id }).from(character_totals))
		.map(row => row.id);
	console.log(`checking ${ids.length} characters${dryRun ? ' (dry run)' : ''}`);

	let fixed = 0;
	for (const id of ids) {
		let diff: string[] = [];
		try {
			await db.transaction(async tx => {
				const read = async () => (await tx.select().from(character_totals)
					.where(eq(character_totals.id, id)).limit(1))[0];
				const before = await read();
				await refreshCharacterTotals(r, id, tx);
				diff = changes(before, await read());
				if (dryRun) throw new DryRun();
			});
		} catch (e) {
			if (!(e instanceof DryRun)) throw e;
		}
		if (!diff.length) continue;
		fixed++;
		console.log(`  ${id}: ${diff.join(', ')}`);
		if (!dryRun) await reindexCharacter(r, id);
	}

	console.log(`\n${fixed} of ${ids.length} characters ${dryRun ? 'would change' : 'fixed'}`);
	process.exit(0);
};

void main();
