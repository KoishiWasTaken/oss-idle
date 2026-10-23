import {
	and,
	eq,
	inArray,
} from 'drizzle-orm';
import { betterScore } from '@oss-idle/shared/scoreOrder';
import { db } from '../db/client';
import { beatmaps } from '../db/schema/beatmap';
import { beatmapset } from '../db/schema/beatmapset';
import type { NewScoreRow } from '../db/schema/score';
import {
	unrankedScores,
	type UnrankedScoreRow,
} from '../db/schema/unranked_score';
import { isSupporter } from '../supporter';
import { unrankedCondition } from './catalog';

/**
 * Leaderboards of players' unranked maps. Nothing here touches the ranked side: the
 * plays sit in their own table, read straight from it (each character's best), and
 * are deleted outright when the map is updated or ranked.
 */

const BOARD_SIZE = 50;

/** The difficulty and its set, when it is in a player's unranked upload. */
const unrankedDifficulty = async (beatmapId: number) => {
	const [row] = await db
		.select({
			beatmap: beatmaps, set: beatmapset, 
		})
		.from(beatmaps)
		.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
		.where(and(eq(beatmaps.id, beatmapId), unrankedCondition))
		.limit(1);
	return row;
};

/** Whether a map's scores go on an unranked leaderboard. */
export const hasUnrankedBoard = async (beatmapId: number): Promise<boolean> =>
	!!(await unrankedDifficulty(beatmapId))?.set.leaderboard;

/** Open a set's leaderboard for good: a supporter uploaded or played it. */
export const openBoard = (setId: number) =>
	db.update(beatmapset).set({ leaderboard: true }).where(eq(beatmapset.id, setId));

/**
 * The difficulty a play on an unranked map is scored on, when it is: its map has a
 * leaderboard, or the player is a supporter, whose play opens one.
 */
export const boardDifficulty = async (beatmapId: number, userId: number) => {
	const found = await unrankedDifficulty(beatmapId);
	if (!found) return undefined;
	if (!found.set.leaderboard) {
		if (!await isSupporter(userId)) return undefined;
		await openBoard(found.set.id);
	}
	return found.beatmap;
};

/** Keep a play for the board; returns its row. */
export const recordUnrankedScore = async (draft: NewScoreRow): Promise<UnrankedScoreRow> => {
	const [{ id }] = await db.insert(unrankedScores).values({
		...draft, id: undefined, pp: '0',
	}).$returningId();
	const [row] = await db.select().from(unrankedScores).where(eq(unrankedScores.id, id));
	return row;
};

/** A map's unranked board: each character's best, best first, its top `size`. */
export const unrankedBoard = async (
	beatmapId: number,
	size = BOARD_SIZE,
	page = 1,
): Promise<UnrankedScoreRow[]> => {
	const rows = await db.select().from(unrankedScores).where(eq(unrankedScores.beatmapId, beatmapId));
	const best = new Map<number, UnrankedScoreRow>();
	for (const row of rows) {
		const held = best.get(row.characterId);
		if (!held || betterScore(row, held)) best.set(row.characterId, row);
	}
	return [...best.values()].sort((a, b) => (betterScore(a, b) ? -1 : 1))
		.slice((page - 1) * size, page * size);
};

/** Delete a set's unranked scores: it was updated or ranked. */
export const wipeUnrankedScores = async (setId: number): Promise<void> => {
	const diffs = await db.select({ id: beatmaps.id }).from(beatmaps).where(eq(beatmaps.setId, setId));
	if (diffs.length) {
		await db.delete(unrankedScores).where(inArray(unrankedScores.beatmapId, diffs.map(d => d.id)));
	}
};
