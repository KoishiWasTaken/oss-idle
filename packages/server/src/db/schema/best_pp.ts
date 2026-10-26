import {
	and,
	desc,
	eq,
} from 'drizzle-orm';
import {
	type AnyMySqlColumn,
	index,
	mysqlTable,
} from 'drizzle-orm/mysql-core';

import type { ServerRuleset } from '../../rulesets/ruleset';
import { db } from '../client';
import { profilePage } from '../profilePage';
import {
	beatmapListColumns,
	beatmaps,
} from './beatmap';
import {
	beatmapset,
	setColumns,
} from './beatmapset';
import {
	bestColumns,
	bestConstraints,
	type ScoreRow,
} from './score';

/** A ruleset's best play per (character, beatmap) by pp. */
export const bestPpTable = <J extends string>(
	name: string,
	judgements: readonly J[],
	scores: { id: AnyMySqlColumn },
) =>
	mysqlTable(name as 'best_pp', bestColumns(judgements, scores), table => [
		...bestConstraints(table),
		// top plays across everyone
		index('pp_idx').on(table.pp, table.id),
	]);

export type BestPpTable = ReturnType<typeof bestPpTable<never>>;
export type BestPPScoreRow = BestPpTable['$inferSelect'];

export const getBestPPPlay = async (
	{ bestPP }: ServerRuleset,
	characterId: number,
	beatmapId: number,
) => {
	const [row] = await db
		.select()
		.from(bestPP)
		.where(
			and(
				eq(bestPP.characterId, characterId),
				eq(bestPP.beatmapId, beatmapId),
			))
		.limit(1);
	return row;
};

export const setNewBestPPPlay = async ({ bestPP }: ServerRuleset, score: ScoreRow) => db
	.insert(bestPP)
	.values(score)
	.onDuplicateKeyUpdate({ set: score });


export const bestPPRows = (
	r: ServerRuleset,
	characterId: number,
	offset: number,
	limit: number,
) => db
	.select({
		best_pp: r.bestPP, beatmap: beatmapListColumns, beatmapset: setColumns(r),
	})
	.from(r.bestPP)
	.innerJoin(beatmaps, eq(beatmaps.id, r.bestPP.beatmapId))
	.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
	.innerJoin(r.setStatus, eq(r.setStatus.setId, beatmapset.id))
	.where(eq(r.bestPP.characterId, characterId))
	.orderBy(desc(r.bestPP.pp))
	.offset(offset)
	.limit(limit);

export const getBestPP = (t: ServerRuleset, characterId: number, page: number = 1) =>
	profilePage(page, (offset, limit) => bestPPRows(t, characterId, offset, limit));