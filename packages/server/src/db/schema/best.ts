import {
	and,
	eq,
} from 'drizzle-orm';
import {
	type AnyMySqlColumn,
	mysqlTable,
} from 'drizzle-orm/mysql-core';

import type { ServerRuleset } from '../../rulesets/ruleset';
import { db } from '../client';
import {
	bestColumns,
	bestConstraints,
	type ScoreRow,
} from './score';

/** A ruleset's best play per (character, beatmap) by score. */
export const bestTable = <J extends string>(
	name: string,
	judgements: readonly J[],
	scores: { id: AnyMySqlColumn },
) =>
	mysqlTable(name as 'best', bestColumns(judgements, scores), bestConstraints);

export type BestTable = ReturnType<typeof bestTable<never>>;
export type BestScoreRow = BestTable['$inferSelect'];

export const getBestPlay = async (
	{ best }: ServerRuleset,
	characterId: number,
	beatmapId: number,
) => {
	const [row] = await db
		.select()
		.from(best)
		.where(
			and(
				eq(best.characterId, characterId),
				eq(best.beatmapId, beatmapId),
			))
		.limit(1);
	return row;
};

export const setNewBestPlay = async ({ best }: ServerRuleset, score: ScoreRow) => db
	.insert(best)
	.values(score)
	.onDuplicateKeyUpdate({ set: score });
