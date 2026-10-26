/**
 * Purge every score set on the intro (circles!), which song select used to
 * launch when entered with the intro still playing.
 *
 *   npm -w @oss-idle/server run purge:intro:prod
 */
import { eq } from 'drizzle-orm';

import { INTRO_SET_ID } from '@oss-idle/shared/beatmap';

import { purgeBeatmapScores } from '../scores';
import { db } from './client';
import { beatmaps } from './schema/beatmap';

const main = async () => {
	const diffs = await db.select({ id: beatmaps.id })
		.from(beatmaps)
		.where(eq(beatmaps.setId, INTRO_SET_ID));
	for (const { id } of diffs) await purgeBeatmapScores(id);
	console.log(`purged ${diffs.length} intro diffs`);
	process.exit(0);
};

void main();
