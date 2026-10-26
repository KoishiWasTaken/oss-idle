import {
	and,
	eq,
	isNull,
} from 'drizzle-orm';

import { INTRO_SET_ID } from '@oss-idle/shared/beatmap';

import { db } from '../db/client';
import { beatmapset } from '../db/schema/beatmapset';
import { fetchBeatmapset } from '../osu/api';

/**
 * Credit a set taken from osu! to its mapper's account: our user ids are osu!'s, so
 * it is theirs even before they first sign in. A set already credited is left as it
 * is, and one osu! can't be asked about now waits for the next try (see
 * db/credit-mappers.ts).
 */
export const creditMapper = async (setId: number, osuSetId: number): Promise<void> => {
	// the intro is everyone's
	if (setId === INTRO_SET_ID) return;
	const [set] = await db.select({ owner: beatmapset.ownerUserId })
		.from(beatmapset).where(eq(beatmapset.id, setId)).limit(1);
	if (!set || set.owner !== null) return;
	try {
		const osu = await fetchBeatmapset(osuSetId);
		if (!osu) return;
		await db.update(beatmapset).set({ ownerUserId: osu.user_id })
			.where(and(eq(beatmapset.id, setId), isNull(beatmapset.ownerUserId)));
	} catch (e) {
		console.warn(`[credit] set ${setId} (osu! ${osuSetId}) left uncredited for now:`, e);
	}
};
