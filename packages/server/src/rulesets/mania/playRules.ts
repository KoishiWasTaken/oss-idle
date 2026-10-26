import {
	fatigueLevel,
	fatigueXp,
	restedFatigue,
	warmup,
	warmupBar,
} from '@oss-idle/shared/fatigue';
import {
	compareGradeGT,
	compareGradeGTE,
	GRADE,
	type Grade,
} from '@oss-idle/shared/grade';

import {
	type ProfileRow,
	skillOf,
} from '../../db/schema/character';
import { bestGradeOn } from '../../db/schema/score';
import { medalMultiplier } from '../../medals';
import {
	mindblockFactor,
	recentMapPlays,
} from '../../mindblock';
import type { Tiredness } from '../play';
import type { ServerRuleset } from '../ruleset';

// The heaviest maps strain the physical skills on about this share of their notes.
const FULL_STRAIN_SHARE = 0.4;

/** Each physical skill's strain past which a note adds fatigue. */
export type StrainThresholds = Readonly<Record<string, number>>;

type Strained = { strainedShare(thresholds: StrainThresholds): number };

/** Minutes of a play the physical skills were strained for. */
export const playStrain = (thresholds: StrainThresholds, bot: Strained, lengthMs: number) => {
	const share = bot.strainedShare(thresholds) / FULL_STRAIN_SHARE;
	return Math.min(1, share) * lengthMs / 60_000;
};

/** How tired and warmed up the character plays right now: warm-up gear warms it faster. */
export const tiredness = (warmupSkill: string) => (profile: ProfileRow): Tiredness => {
	const tired = restedFatigue(profile.fatigue ?? undefined, Date.now());
	const { upgrades } = skillOf(profile, warmupSkill);
	return {
		fatigue: fatigueLevel(tired),
		warmup: warmup(tired, upgrades),
		warmupBar: warmupBar(tired, upgrades),
	};
};

/** What moves a mania play's xp on the server, on top of the bot's split. */
export type XpRules<S extends string> = {
	/** the skills replaying a map recently dulls */
	mindblock: readonly S[],
	modMultipliers: Record<S, number>,
	grade: Grade,
	/** the map's stars at the play's rate */
	stars: number,
	fatigue: number,
};

/** The xp a finished play is worth: mindblock, fatigue, medals, the bonus for a first X
 *  and mods, applied to the bot's `skillXp` in place. */
export const serverXp = async <S extends string>(
	r: ServerRuleset,
	characterId: number,
	beatmapId: number,
	skillXp: Record<S, number>,
	{
		mindblock, modMultipliers, grade, stars, fatigue,
	}: XpRules<S>,
): Promise<Record<S, number>> => {
	const scale = (names: readonly S[], factor: number) => {
		for (const name of names) skillXp[name] = Math.floor(skillXp[name] * factor);
	};
	const topGrade = await bestGradeOn(r, characterId, beatmapId);

	// read from the persisted history, before this play is stored
	const block = mindblockFactor(await recentMapPlays(r, characterId, beatmapId));
	if (block < 1) scale(mindblock, block);
	scale(r.def.physicalSkills as S[], fatigueXp(fatigue));
	scale(Object.keys(skillXp) as S[], await medalMultiplier(r, characterId));

	const accuracy = 'accuracy' as S;
	if (compareGradeGTE(grade, GRADE.X) && (!topGrade || compareGradeGT(grade, topGrade))) {
		skillXp[accuracy] += Math.floor(1000 * stars);
	}

	for (const name of Object.keys(skillXp) as S[]) {
		skillXp[name] = Math.floor(skillXp[name] * modMultipliers[name]);
	}
	return skillXp;
};
