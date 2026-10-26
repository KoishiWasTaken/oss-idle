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
import type { UnrankedScoreRow } from '../db/schema/unranked_score';
import {
	enabledRulesets,
	rulesetOfBeatmap,
} from '../rulesets/registry';
import type { ServerRuleset } from '../rulesets/ruleset';
import { isSupporter } from '../supporter';
import {
	unrankedCondition,
	withStatus,
} from './catalog';

/**
 * Leaderboards of players' unranked maps. Nothing here touches the ranked side: the
 * plays sit in their own table, read straight from it (each character's best), and
 * are deleted outright when the map is updated or ranked.
 */

const BOARD_SIZE = 50;

/** The difficulty and its set, when it is in a player's unranked upload. */
const unrankedDifficulty = async (beatmapId: number) => {
	const r = await rulesetOfBeatmap(beatmapId);
	if (!r) return undefined;
	const [row] = await db
		.select({
			beatmap: beatmaps, setId: beatmapset.id, leaderboard: r.setStatus.leaderboard,
		})
		.from(beatmaps)
		.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
		.innerJoin(...withStatus(r))
		.where(and(eq(beatmaps.id, beatmapId), unrankedCondition(r)))
		.limit(1);
	return row && {
		...row, r,
	};
};

/** Whether a map's scores go on an unranked leaderboard. */
export const hasUnrankedBoard = async (beatmapId: number): Promise<boolean> =>
	!!(await unrankedDifficulty(beatmapId))?.leaderboard;

/** Open a set's leaderboard for good in a ruleset, or all: a supporter uploaded or played it. */
export const openBoard = async (setId: number, rulesets = enabledRulesets()) => {
	for (const r of rulesets) {
		await db.update(r.setStatus).set({ leaderboard: true }).where(eq(r.setStatus.setId, setId));
	}
};

/**
 * The difficulty a play on an unranked map is scored on, when it is: its map has a
 * leaderboard, or the player is a supporter, whose play opens one.
 */
export const boardDifficulty = async (beatmapId: number, userId: number) => {
	const found = await unrankedDifficulty(beatmapId);
	if (!found) return undefined;
	if (!found.leaderboard) {
		if (!await isSupporter(userId)) return undefined;
		await openBoard(found.setId, [found.r]);
	}
	return found.beatmap;
};

/** Keep a play for the board; returns its row. */
export const recordUnrankedScore = async (
	{ unrankedScores }: ServerRuleset,
	draft: NewScoreRow,
): Promise<UnrankedScoreRow> => {
	const [{ id }] = await db.insert(unrankedScores).values({
		...draft, id: undefined, pp: '0',
	}).$returningId();
	const [row] = await db.select().from(unrankedScores).where(eq(unrankedScores.id, id));
	return row;
};

/** A map's unranked board: each character's best, best first, its top `size`. */
export const unrankedBoard = async (
	{ unrankedScores }: ServerRuleset,
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
export const wipeUnrankedScores = async (
	setId: number,
	rulesets: readonly ServerRuleset[] = enabledRulesets(),
): Promise<void> => {
	const diffs = await db.select({ id: beatmaps.id }).from(beatmaps).where(eq(beatmaps.setId, setId));
	if (!diffs.length) return;
	for (const { unrankedScores } of rulesets) {
		await db.delete(unrankedScores).where(inArray(unrankedScores.beatmapId, diffs.map(d => d.id)));
	}
};
