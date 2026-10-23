import {
	index,
	mysqlTable,
} from 'drizzle-orm/mysql-core';
import { scoreTableDefinition } from './score';

/** Plays on players' unranked maps that have a leaderboard: never ranked (no pp, no XP),
 *  wiped when the map is updated or ranked. Ids start at 1.5e9, past `score`'s. */
// ponytail: id spaces kept apart by the start value; give the DTO a kind if they ever meet
export const unrankedScores = mysqlTable('unranked_score', scoreTableDefinition, table => [
	index('unranked_score_beatmap_idx').on(table.beatmapId),
]);

export type UnrankedScoreRow = typeof unrankedScores.$inferSelect;
