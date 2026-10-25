import { betterScore } from '@oss-idle/shared/scoreOrder';
import { parseMods } from '@oss-idle/shared/mods';
import {
	and,
	eq,
} from 'drizzle-orm';
import * as ppjs from 'rosu-pp-js';
import { type SkillName } from '@oss-idle/shared/skills';
import { db } from './db/client';
import {
	characters,
	getCharacterById,
	type CharacterRow,
} from './db/schema/character';
import {
	beatmaps,
	getBeatmapById,
} from './db/schema/beatmap';
import { beatmapset } from './db/schema/beatmapset';
import { calculatePP } from './pp';
import { announce } from './ws/chat';
import { ANNOUNCE_CHANNEL } from '@oss-idle/shared/community/wire';
import {
	billionsMessage,
	firstPlaceMessage,
	isSkillLevelMilestone,
	ppsMessage,
	skillLevelMessage,
} from '@oss-idle/shared/community/announcements';
import { skillName } from '@oss-idle/shared/display/skills';
import {
	getSkillMilestones,
	setSkillMilestone,
} from './db/schema/skill_milestone';
import {
	getScoreById,
	scores,
	type NewScoreRow,
	type ScoreRow,
} from './db/schema/score';
import {
	best,
	getBestPlay,
	setNewBestPlay,
} from './db/schema/best';
import {
	getCharacterTotals,
	refreshCharacterTotals,
} from './db/schema/character_totals';
import {
	bestPP,
	getBestPPPlay,
	setNewBestPPPlay,
} from './db/schema/best_pp';
import {
	addBeatmapPlayed,
	beatmaps_played,
} from './db/schema/beatmaps_played';
import {
	firstPlace,
	getFirstPlace,
	setNewFirstPlace,
} from './db/schema/first_place';
import {
	beatmapPageIds,
	reindexCharacter,
	unindexBeatmap,
} from './rankings';
import Overall from '@oss-idle/shared/sim/skills/overall';
import { makeOrderedSkills } from '@oss-idle/shared/sim/skills/factory';

/** Recompute only the character's pp: the weighted (0.95^i) sum of its per-map
 *  best pp, read straight from the `best_pp` table (one row per beatmap). Leaves
 *  total/ranked score untouched. */
export async function recomputePP(characterId: number): Promise<void> {
	const rows = await db
		.select({ pp: bestPP.pp })
		.from(bestPP)
		.where(eq(bestPP.characterId, characterId));

	const pp = rows
		.map(r => Number(r.pp))
		.sort((a, b) => b - a)
		.reduce((sum, p, i) => sum + p * Math.pow(0.95, i), 0);

	await db
		.update(characters)
		.set({ pp: String(Math.round(pp * 1000) / 1000) })
		.where(eq(characters.id, characterId));
}

/**
 * Erase every trace of a beatmap from player progression: its scores, per-map
 * bests, first places and play counts, with each affected character's totals,
 * pp and ranking index rebalanced. Runs when a difficulty (or its whole set)
 * is unranked. Skill XP is not reverted - there is no per-map XP ledger.
 */
export async function purgeBeatmapScores(beatmapId: number): Promise<void> {
	const perCharacter = await db
		.selectDistinct({ characterId: scores.characterId })
		.from(scores)
		.where(eq(scores.beatmapId, beatmapId));
	// No scores, nothing derived from them either.
	if (!perCharacter.length) return;

	await db.delete(best).where(eq(best.beatmapId, beatmapId));
	await db.delete(bestPP).where(eq(bestPP.beatmapId, beatmapId));
	await db.delete(firstPlace).where(eq(firstPlace.beatmapId, beatmapId));
	await db.delete(scores).where(eq(scores.beatmapId, beatmapId));
	await db.delete(beatmaps_played).where(eq(beatmaps_played.beatmapId, beatmapId));
	await db.update(beatmaps).set({ plays: 0 }).where(eq(beatmaps.id, beatmapId));

	await unindexBeatmap(beatmapId);
	for (const row of perCharacter) {
		await refreshCharacterTotals(row.characterId);
		await recomputePP(row.characterId);
		await reindexCharacter(row.characterId);
	}
}

/** Whether a difficulty's set is loved: its plays give no pp. */
const isLovedBeatmap = async (beatmapId: number) => {
	const [row] = await db.select({ id: beatmaps.id })
		.from(beatmaps)
		.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
		.where(and(eq(beatmaps.id, beatmapId), eq(beatmapset.status, 'loved')))
		.limit(1);
	return !!row;
};

/** Insert a score and refresh the character's profile aggregates. The single
 *  entry point for a new ranked play. */
export async function submitScore(draft: NewScoreRow) {
	const loved = await isLovedBeatmap(draft.beatmapId);
	await addBeatmapPlayed(draft.characterId, draft.beatmapId);
	const [ins] = await db.insert(scores).values(loved ? {
		...draft, pp: '0',
	} : draft);
	const score = (await getScoreById(ins.insertId))!;
	await onSubmitScore(score, true, loved);
	return score;
}

export const onSubmitScore = async (score: ScoreRow, recompute = true, loved?: boolean) => {
	const before = (await getCharacterTotals(score.characterId)).rankedScore;
	await checkNewBest(score);
	await refreshCharacterTotals(score.characterId);
	const after = (await getCharacterTotals(score.characterId)).rankedScore;
	if (Math.floor(after / 1_000_000_000) > Math.floor(before / 1_000_000_000)) {
		await announceBillions(score, after);
	}
	if (!(loved ?? await isLovedBeatmap(score.beatmapId))) await checkNewBestPP(score, recompute);
	await checkNewFirstPlace(score);
};

/**
 * Reprice a difficulty's scores after its set moved between ranked and loved:
 * loved gives no pp, ranked prices every score again from what it stored. Scores,
 * bests, #1s and ranked score stay; pp, top plays and the pp ranking follow.
 */
export const repriceBeatmapScores = async (beatmapId: number, loved: boolean): Promise<void> => {
	const rows = await db.select().from(scores).where(eq(scores.beatmapId, beatmapId));
	if (!rows.length) return;

	const chart = loved ? undefined : (await getBeatmapById(beatmapId))?.chart;
	const map = chart ? new ppjs.Beatmap(chart) : undefined;
	const priced = rows.map(row => ({
		...row,
		pp: String(map ? calculatePP({
			score: row.score, accuracy: Number(row.accuracy), maxCombo: row.maxCombo, counts: row,
		}, map, Number(row.rate), parseMods(row.mods)) : 0),
	}));
	// bests and #1s are copies of their score: keep their pp in step
	for (const row of priced) {
		for (const table of [scores, best, firstPlace]) {
			await db.update(table).set({ pp: row.pp }).where(eq(table.id, row.id));
		}
	}

	await db.delete(bestPP).where(eq(bestPP.beatmapId, beatmapId));
	const characterIds = new Set(priced.map(row => row.characterId));
	if (!loved) {
		const top = new Map<number, ScoreRow>();
		for (const row of priced) {
			const held = top.get(row.characterId);
			if (!held || compareScoresPP(row, held)) top.set(row.characterId, row);
		}
		for (const row of top.values()) await setNewBestPPPlay(row);
	}
	for (const characterId of characterIds) {
		await recomputePP(characterId);
		await reindexCharacter(characterId);
	}
};

export const compareScores = (s1: ScoreRow, s2: ScoreRow) => betterScore(s1, s2);

export const compareScoresPP = (s1: ScoreRow, s2: ScoreRow) => {
	const d1 = parseFloat(s1.pp) - parseFloat(s2.pp);
	if (isNaN(d1)) return false;
	if (d1 !== 0) return d1 > 0;
	return (s1.id - s2.id) < 0;
};

export const checkNewBest = async (score: ScoreRow) => {
	const best = await getBestPlay(score.characterId, score.beatmapId);
	if (best && compareScores(best, score)) return;
	await setNewBestPlay(score);
};

export const checkNewBestPP = async (score: ScoreRow, recompute = true) => {
	const best = await getBestPPPlay(score.characterId, score.beatmapId);
	if (best && compareScoresPP(best, score)) return;

	await setNewBestPPPlay(score);
	if (recompute) {
		const before = await getCharacterById(score.characterId);
		await recomputePP(score.characterId);
		const after = await getCharacterById(score.characterId);

		if (Math.floor(Number(after.pp) / 1000) > Math.floor(Number(before.pp) / 1000)) {
			announcePps(after);
		}
	}
};

export const checkNewFirstPlace = async (score: ScoreRow) => {
	const best = await getFirstPlace(score.beatmapId);
	if (best && compareScores(best, score)) return;

	await setNewFirstPlace(score);
	// Beating your own #1 is not news.
	if (best?.characterId === score.characterId) return;
	await announceFirstPlace(score);
};

/** Hand a map's #1 to whoever now tops its leaderboard (a restriction lifted or set). */
export const recomputeFirstPlace = async (beatmapId: number) => {
	const [top] = await beatmapPageIds(beatmapId, 1);
	const row = top === undefined ? undefined : await getBestPlay(top, beatmapId);
	if (row) await setNewFirstPlace(row);
	else await db.delete(firstPlace).where(eq(firstPlace.beatmapId, beatmapId));
};

/** Server-announce a new #1 in chat (a "perfect" variant for a max score). */
const announceFirstPlace = async (score: ScoreRow) => {
	const [character, beatmap] = await Promise.all([
		getCharacterById(score.characterId),
		getBeatmapById(score.beatmapId),
	]);
	if (!character || !beatmap) return;

	const perfect = score.score >= 1_000_000;
	announce(
		ANNOUNCE_CHANNEL, 
		firstPlaceMessage(character.name, beatmap, perfect), 
		perfect ? '#c794ff' : '#fa81c6',
	);
};

/** Server-announce a new #1 in chat (a "perfect" variant for a max score). */
const announceBillions = async (score: ScoreRow, rankedScore: number) => {
	const character = await getCharacterById(score.characterId);
	if (!character) return;

	const billions = Math.floor(rankedScore / 1_000_000_000) * 1_000_000_000;
	announce(
		ANNOUNCE_CHANNEL, 
		billionsMessage(character.name, billions), 
		'#81e2fa',
	);
};

/** Server-announce a new #1 in chat (a "perfect" variant for a max score). */
const announcePps = async (character: CharacterRow) => {
	const pps = Math.floor(Number(character.pp) / 1_000) * 1_000;
	announce(
		ANNOUNCE_CHANNEL, 
		ppsMessage(character.name, pps), 
		'#fa9981',
	);
};

/** Highest announceable level in (from, to], if any was crossed. */
const highestMilestone = (from: number, to: number) => {
	for (let level = to; level > from; level--) {
		if (isSkillLevelMilestone(level)) return level;
	}
};

/** Server-announce newly crossed skill level milestones in chat. Announced at
 *  most once per character ever (tracked in `skill_milestone`), so a level
 *  reset then re-climb stays silent. */
const announceSkillLevels = async (
	character: CharacterRow,
	levels: { skill: SkillName | 'overall'; from: number; to: number }[],
) => {
	const reached = levels.flatMap(({ skill, from, to }) => {
		const level = highestMilestone(from, to);
		return level === undefined ? [] : [{
			skill, level, 
		}];
	});
	if (!reached.length) return;

	const announced = await getSkillMilestones(character.id);
	for (const { skill, level } of reached) {
		if (level <= (announced.get(skill) ?? 0)) continue;
		await setSkillMilestone(character.id, skill, level);
		announce(
			ANNOUNCE_CHANNEL,
			skillLevelMessage(character.name, skillName(skill), level),
			'#81fa9b',
		);
	}
};

/** Apply per-skill XP gains to a character, reusing the shared levelling curve.
 *  Returns the per-skill before/after progression for the result screen. */
export async function applySkillXp(
	characterId: number,
	xp: Record<SkillName, number>,
	/** Off when catching xp up after a rollback: those milestones were announced
	 *  when they were first reached, and the channel should not hear them twice. */
	announceMilestones = true,
) {
	// The read and the write are one locked transaction: this writes back levels
	// and totals it read at the start, so a purchase committing in between would
	// be silently reverted - the spent levels handed back while the upgrade it
	// bought stays (`${skill}Upgrades` isn't in the update set).
	const {
		row, gains, overallLevel,
	} = await db.transaction(async tx => {
		const [row] = await tx
			.select()
			.from(characters)
			.where(eq(characters.id, characterId))
			.limit(1)
			.for('update');
		if (!row) throw new Error(`character ${characterId} not found`);

		const skills = makeOrderedSkills();
		const overall = new Overall();
		overall.level.set(row.overallLevel);
		overall.xp.set(row.overallXp);
		let overallXpGained = 0;
		const gains = skills.map(skill => {
			const fromLevel = row[`${skill.name}Level`];
			const fromXp = row[`${skill.name}Xp`];
			skill.level.set(fromLevel);
			skill.xp.set(fromXp);
			overallXpGained += xp[skill.name];
			const levels = skill.gainXP(xp[skill.name] ?? 0);
			return {
				skill: skill.name, 
				gained: xp[skill.name] ?? 0, 
				fromLevel, 
				fromXp,
				toLevel: skill.level.get(),
				toXp: Math.round(skill.xp.get()),
				levels, 
				xp: xp[skill.name], 
			};
		});

		overall.gainXP(overallXpGained);

		const updates = Object.fromEntries(
			[
				...gains.flatMap(g => [
					[`${g.skill}Level`, g.toLevel],
					[`${g.skill}Xp`, g.toXp],
					[`${g.skill}TotalXp`, row[`${g.skill}TotalXp`] + g.xp],
					[`${g.skill}LifetimeXp`, row[`${g.skill}LifetimeXp`] + g.xp],
				]),
				['overallLevel', overall.level.get()],
				['overallXp', overall.xp.get()],
				['overallTotalXp', row.overallTotalXp + overallXpGained],
				['overallLifetimeXp', row.overallLifetimeXp + overallXpGained],
			],
		) as Record<`${
			'overall'
			| SkillName}Level` 
			| `${'overall' 
			| SkillName}Xp` 
			| `${'overall' 
			| SkillName}TotalXp`
			| `${'overall' 
			| SkillName}LifetimeXp`,
		number
		>;

		await tx.update(characters).set(updates).where(eq(characters.id, characterId));
		return {
			row, gains, overallLevel: overall.level.get(),
		};
	});

	// Discord I/O never holds the row lock.
	if (announceMilestones) await announceSkillLevels(row, [
		...gains.map(g => ({
			skill: g.skill as SkillName, from: g.fromLevel, to: g.toLevel,
		})),
		{
			skill: 'overall', from: row.overallLevel, to: overallLevel,
		},
	]);
	return gains;
}
