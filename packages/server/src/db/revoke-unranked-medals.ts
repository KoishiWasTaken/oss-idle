/**
 * Take back the medals earned through scores that are gone: unranking a map
 * purges its scores, but the medal lines' bests kept what they had reached and
 * the medals stayed. The lines read only off scores go back to their live value,
 * and the score medals no longer earned are removed (grades from slowed plays
 * too, which no longer count). #1s, pp and play feats
 * (a fail, the night owl) are left alone: a stored best there may be a lost #1
 * or an older pp rework, not a purged score.
 *
 *   npm -w @oss-idle/server run revoke:medals:prod -- --dry-run [--ruleset mania4k]
 */
import {
	and,
	eq,
	inArray,
} from 'drizzle-orm';

import {
	earnedWithLive,
	recordProgress,
} from '../medals';
import { reindexCharacter } from '../rankings';
import {
	loadRulesets,
	rulesetFromArgs,
} from '../rulesets/registry';
import { db } from './client';
import { characters } from './schema/character';
import { getMedals } from './schema/character_medal';

const dryRun = process.argv.includes('--dry-run');

const LINES = ['pass', 'fc', 'plays', 'hits', 'time'];
const ONE_OFFS = [
	'rice', 'ln', 'grade-ss', 'grade-x', 'grade-xx', 'combo-727', 'same-map-100', 'possessed', 'parallax',
	'wonderful',
];

const fromScores = (id: string) => ONE_OFFS.includes(id) || LINES.some(l => id.startsWith(`${l}-`));

const main = async () => {
	await loadRulesets();
	const r = rulesetFromArgs();
	const { medals: characterMedals, progress: characterProgress } = r;
	const all = (await db.select({ character: characters })
		.from(characters)
		.innerJoin(r.profile, eq(r.profile.id, characters.id)))
		.map(row => row.character);
	console.log(`checking ${all.length} characters${dryRun ? ' (dry run)' : ''}`);

	let revoked = 0;
	for (const character of all) {
		const held = (await getMedals(r, character.id)).map(m => m.medalId).filter(fromScores);
		const earned = new Set(held.length ? await earnedWithLive(r, character, LINES) : []);
		const lost = held.filter(id => !earned.has(id));
		if (lost.length) {
			revoked++;
			console.log(`  ${character.id} ${character.name}: ${lost.join(', ')}`);
		}
		if (dryRun) continue;
		await db.transaction(async tx => {
			if (lost.length) await tx.delete(characterMedals).where(and(
				eq(characterMedals.characterId, character.id),
				inArray(characterMedals.medalId, lost),
			));
			await tx.delete(characterProgress).where(and(
				eq(characterProgress.characterId, character.id),
				inArray(characterProgress.line, LINES),
			));
		});
		await recordProgress(r, character.id);
		if (lost.length) await reindexCharacter(r, character.id);
	}

	console.log(`\n${revoked} of ${all.length} characters ${dryRun ? 'would lose' : 'lost'} medals`);
	process.exit(0);
};

void main();
