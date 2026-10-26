import {
	eq,
	isNull,
	or,
	sql,
} from 'drizzle-orm';

import { db } from '../db/client';
import { beatmaps } from '../db/schema/beatmap';
import { redisKeyPrefix } from '../env';
import { starsAtRates } from '../pp';
import { redis } from '../redis';
import { timingColumns } from './timingPoints';

const LOCK = `${redisKeyPrefix}beatmaps:rate-stars`;

/** Fill in the stars at every rate and the timing line counts of the
 *  difficulties ingested before them, on one worker. A fraction of a second per
 *  difficulty, so it runs in the background and the song select shows base
 *  stars until it's through. */
export const backfillRateStars = async (): Promise<void> => {
	if (!await redis.set(LOCK, '1', 'EX', 3600, 'NX')) return;
	try {
		const missing = await db.select({
			id: beatmaps.id,
			noStars: sql<number>`${beatmaps.rateStars} is null`,
			noTiming: sql<number>`${beatmaps.svPoints} is null`,
		})
			.from(beatmaps)
			.where(or(isNull(beatmaps.rateStars), isNull(beatmaps.svPoints)));
		for (const { id, noStars, noTiming } of missing) {
			const [row] = await db.select({ chart: beatmaps.chart }).from(beatmaps).where(eq(beatmaps.id, id));
			if (!row?.chart) continue;
			try {
				await db.update(beatmaps).set({
					...noStars ? { rateStars: starsAtRates(row.chart) } : {},
					...noTiming ? timingColumns(row.chart) : {},
				}).where(eq(beatmaps.id, id));
			} catch (e) {
				console.error('[beatmaps] backfill failed for', id, e);
			}
			// let the worker's requests through between maps
			await new Promise(resolve => setImmediate(resolve));
		}
	} catch (e) {
		console.error('[beatmaps] rate stars backfill failed', e);
	} finally {
		await redis.del(LOCK);
	}
};
