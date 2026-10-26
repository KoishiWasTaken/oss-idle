import {
	and,
	eq,
} from 'drizzle-orm';

import {
	listedCondition,
	withStatus,
} from './beatmaps/catalog';
import { db } from './db/client';
import { beatmaps } from './db/schema/beatmap';
import { beatmapset } from './db/schema/beatmapset';
import type { ServerRuleset } from './rulesets/ruleset';

/**
 * The stored `.osu` chart text for a beatmap, or null when the server hasn't
 * ingested it. A null result means the map is *unranked* - the client falls
 * back to local play (local score, no XP). Populated by `ingest-beatmaps`.
 */
export async function loadChart(beatmapId: number): Promise<string | null> {
	const [row] = await db
		.select({ chart: beatmaps.chart })
		.from(beatmaps)
		.where(eq(beatmaps.id, beatmapId))
		.limit(1);
	return row?.chart ?? null;
}

export async function getBeatmap(beatmapId: number) {
	const [row] = await db
		.select()
		.from(beatmaps)
		.where(eq(beatmaps.id, beatmapId))
		.limit(1);
	return row;
}

/** A diff that plays ranked in the ruleset: ranked itself, in a set live there, never the intro. */
export async function getLiveBeatmap(r: ServerRuleset, beatmapId: number) {
	const [row] = await db
		.select({ beatmap: beatmaps })
		.from(beatmaps)
		.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
		.innerJoin(...withStatus(r))
		.where(and(eq(beatmaps.id, beatmapId), listedCondition(r)))
		.limit(1);
	return row?.beatmap;
}
