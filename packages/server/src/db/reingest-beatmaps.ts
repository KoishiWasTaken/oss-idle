import 'dotenv/config';

import {
	existsSync,
	readFileSync,
} from 'node:fs';

import {
	and,
	inArray,
	isNotNull,
	isNull,
} from 'drizzle-orm';

import { ingestOsz } from '../beatmaps/ingest';
import { oszPath } from '../beatmaps/storage';
import {
	db,
	pool,
} from './client';
import { beatmapset } from './schema/beatmapset';

/**
 * Re-reads sets from their own stored .osz, ranked ones included: picks up the
 * difficulties an older ingest skipped (no osu! id, or a ruleset it didn't keep yet),
 * ranked like any other; the set's other difficulties stay as they are. `--all` reads
 * every set still up whose .osz is stored.
 *
 * Only osu!'s sets: ingest finds those again by their osu! id. A set without one, or a
 * player's upload, it would not find, and would store again as a new set.
 *
 *   npm -w @oss-idle/server run reingest:beatmaps[:prod] -- <setId> [<setId>…]
 *   npm -w @oss-idle/server run reingest:beatmaps[:prod] -- --all
 */
const main = async (): Promise<void> => {
	const all = process.argv[2] === '--all';
	const asked = all ? [] : process.argv.slice(2).map(Number);
	if (!all && (!asked.length || asked.some(id => !Number.isInteger(id)))) {
		throw new Error('Pass set ids, or --all');
	}
	const readable = (await db.select({ id: beatmapset.id }).from(beatmapset).where(and(
		isNull(beatmapset.deletedAt), isNotNull(beatmapset.osuId), isNull(beatmapset.uploadedAt),
		...all ? [] : [inArray(beatmapset.id, asked)],
	))).map(s => s.id).filter(id => existsSync(oszPath(id)));
	const skipped = asked.filter(id => !readable.includes(id));
	if (skipped.length) throw new Error(`Not osu! sets with a stored .osz: ${skipped.join(', ')}`);
	const ids = readable;
	let failed = 0;
	for (const id of ids) {
		try {
			const { setId, difficulties } = await ingestOsz(readFileSync(oszPath(id)), { allowRanked: true });
			if (setId !== id) throw new Error(`stored again as set ${setId}`);
			console.log(`✓ ${id}: ${difficulties} difficulties`);
		} catch (e) {
			failed++;
			console.error(`✗ ${id}:`, e instanceof Error ? e.message : e);
		}
	}
	console.log(`${ids.length - failed}/${ids.length} sets re-read`);
	if (failed) process.exitCode = 1;
};

main()
	.catch(e => { console.error(e); process.exitCode = 1; })
	.finally(() => pool.end());
