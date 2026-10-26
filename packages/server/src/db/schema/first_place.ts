import {
	count,
	desc,
	eq,
} from 'drizzle-orm';
import {
	type AnyMySqlColumn,
	mysqlTable,
	primaryKey,
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
	type ScoreRow,
} from './score';

/** A ruleset's #1 play per beatmap. */
export const firstPlaceTable = <J extends string>(
	name: string,
	judgements: readonly J[],
	scores: { id: AnyMySqlColumn },
) =>
	mysqlTable(name as 'first_place', bestColumns(judgements, scores), table => [
		primaryKey({ columns: [table.beatmapId] }),
	]);

export type FirstPlaceTable = ReturnType<typeof firstPlaceTable<never>>;
export type FirstPlaceRow = FirstPlaceTable['$inferSelect'];

export const setNewFirstPlace = async ({ firstPlace }: ServerRuleset, score: ScoreRow) => db
	.insert(firstPlace)
	.values(score)
	.onDuplicateKeyUpdate({ set: score });

export const getNbFirstPlaces = async (
	{ firstPlace }: ServerRuleset,
	characterId: number,
) => (await db
	.select({ count: count() })
	.from(firstPlace)
	.where(eq(firstPlace.characterId, characterId))
	.limit(1))[0]?.count ?? 0
;

export const firstPlaceRows = (
	r: ServerRuleset,
	characterId: number,
	offset: number,
	limit: number,
) => db
	.select({
		first_place: r.firstPlace, beatmap: beatmapListColumns, beatmapset: setColumns(r),
	})
	.from(r.firstPlace)
	.innerJoin(beatmaps, eq(beatmaps.id, r.firstPlace.beatmapId))
	.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
	.innerJoin(r.setStatus, eq(r.setStatus.setId, beatmapset.id))
	.where(eq(r.firstPlace.characterId, characterId))
	.orderBy(desc(r.firstPlace.playedAt))
	.offset(offset)
	.limit(limit);

export const getFirstPlaces = (t: ServerRuleset, characterId: number, page: number = 1) =>
	profilePage(page, (offset, limit) => firstPlaceRows(t, characterId, offset, limit));

export const getFirstPlace = async ({ firstPlace }: ServerRuleset, beatmapId: number) => {
	return (await db
		.select()
		.from(firstPlace)
		.where(eq(firstPlace.beatmapId, beatmapId)))[0];
	;
};