import {
	index,
	mysqlTable,
} from 'drizzle-orm/mysql-core';

import { scoreColumns } from './score';

/** Plays on players' unranked maps that have a leaderboard: never ranked (no pp, no XP),
 *  wiped when the map is updated or ranked. Ids start at 1.5e9, past `score`'s. */
// ponytail: id spaces kept apart by the start value; give the DTO a kind if they ever meet
export const unrankedScoreTable = <J extends string>(name: string, judgements: readonly J[]) =>
	mysqlTable(name as 'unranked_score', scoreColumns(judgements), table => [
		index('unranked_score_beatmap_idx').on(table.beatmapId),
	]);

export type UnrankedScoreTable = ReturnType<typeof unrankedScoreTable<never>>;
export type UnrankedScoreRow = UnrankedScoreTable['$inferSelect'];
