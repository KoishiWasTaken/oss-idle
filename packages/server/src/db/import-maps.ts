import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { invalidateCatalog } from '../beatmaps/catalog';
import { ingestOsz } from '../beatmaps/ingest';
import { loadRulesets } from '../rulesets/registry';

/**
 * Puts .osz files up as unranked maps, past the upload quota and map checks: each one
 * a set of its own, credited to the mapper's account (their osu! id), or to no account.
 *
 *   npm -w @oss-idle/server run import:maps[:prod] -- [--owner <osu! user id>] <file.osz>…
 */
const main = async (): Promise<void> => {
	const args = process.argv.slice(2);
	const at = args.indexOf('--owner');
	const userId = at < 0 ? undefined : Number(args.splice(at, 2)[1]);
	if (userId !== undefined && !Number.isInteger(userId)) throw new Error('--owner takes an osu! user id');
	if (!args.length) throw new Error('Pass .osz files');
	await loadRulesets();
	for (const file of args) {
		const { setId, ids } = await ingestOsz(readFileSync(file), { owner: { userId } });
		console.log(`${basename(file)} ${setId} ${Object.values(ids?.beatmaps ?? {}).join(',')}`);
	}
	await invalidateCatalog();
};

main()
	.then(() => process.exit(0))
	.catch(e => { console.error(e); process.exit(1); });
