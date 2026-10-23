import 'dotenv/config';
import {
	and,
	isNotNull,
	isNull,
} from 'drizzle-orm';
import {
	db,
	pool,
} from './client';
import { beatmapset } from './schema/beatmapset';
import { creditMapper } from '../beatmaps/credit';

/**
 * Credits every set taken from osu! that has no owner yet to its mapper's account
 * (one osu! lookup each, through the scheduler). Safe to run again.
 *
 *   npm -w @oss-idle/server run credit:mappers[:prod]
 */
const main = async (): Promise<void> => {
	const sets = await db.select({
		id: beatmapset.id, osuId: beatmapset.osuId, 
	})
		.from(beatmapset)
		.where(and(
			isNotNull(beatmapset.osuId), isNull(beatmapset.ownerUserId), isNull(beatmapset.deletedAt),
		));
	for (const { id, osuId } of sets) await creditMapper(id, osuId!);
	console.log(`✓ looked up ${sets.length} sets`);
};

main()
	.catch(e => { console.error(e); process.exitCode = 1; })
	.finally(() => pool.end());
