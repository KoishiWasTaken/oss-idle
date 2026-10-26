import '@oss-idle/shared/osu/controlPointPatch';

import { BeatmapDecoder } from 'osu-parsers';

import { warmupTrend } from '@oss-idle/shared/fatigue';
import { allowedRate } from '@oss-idle/shared/rate';
import Bot7k from '@oss-idle/shared/rulesets/mania/7k/bots/character';
import { modXpMultipliers7k } from '@oss-idle/shared/rulesets/mania/7k/modXp';
import {
	MINDBLOCK_SKILLS_7K,
	PHYSICAL_SKILLS_7K,
	SKILL_7K,
	Skills7k,
} from '@oss-idle/shared/rulesets/mania/7k/skills';
import { tireSkill7k } from '@oss-idle/shared/rulesets/mania/7k/tiring';
import { xpScore } from '@oss-idle/shared/rulesets/mania/xpScore';
import SkillState from '@oss-idle/shared/rulesets/skillState';

import { getPlays } from '../../../db/schema/beatmaps_played';
import {
	type ProfileRow,
	skillOf,
} from '../../../db/schema/character';
import type { RulesetPlay } from '../../play';
import {
	playStrain,
	serverXp,
	tiredness,
} from '../playRules';
import { runManiaPlay } from '../simulate';

const decoder = new BeatmapDecoder();

// Notes where no physical skill strains past this add no fatigue.
const STRAINED_7K = Object.fromEntries(PHYSICAL_SKILLS_7K.map(skill => [skill, 0.2]));

/** The character's 7K skills at its current progress, tired. */
const loadSkills = (profile: ProfileRow, fatigue: number, warm: number) => Skills7k.map(name => {
	const skill = new SkillState(name);
	skill.apply(skillOf(profile, name));
	tireSkill7k(skill, fatigue, warm);
	return skill;
});

/** 7K's play: its own bot and skills, mania's engine, the shared fatigue and xp rules. */
export const play: RulesetPlay = {
	tiredness: tiredness(SKILL_7K.stamina),
	allowedRate: (profile, rate) => allowedRate(rate, skillOf(profile, SKILL_7K.speed).upgrades),
	warmupTrend: ({ minutes, strained }) => warmupTrend(minutes, strained),
	async simulate(r, {
		profile, beatmapId, chart: text, sr, rate, mods, round, board, tired,
	}) {
		const { fatigue, warmup: warm } = tired;
		const skills = loadSkills(profile, fatigue, warm);
		const bot = new Bot7k(skills, await getPlays(r, profile.id, beatmapId));
		const chart = decoder.decodeFromString(text);
		const options = {
			rate, mods, playOn: round,
		};
		const { game, played } = runManiaPlay(chart, bot, options, round);
		if (board) return {
			...played, skillXp: Object.fromEntries(r.def.skills.map(s => [s, 0])),
		};
		const length = chart.totalLength / rate;
		const score = xpScore(chart, game, options);
		return {
			...played,
			skillXp: await serverXp(r, profile.id, beatmapId, bot.getSkillsXP(length, score), {
				mindblock: MINDBLOCK_SKILLS_7K,
				modMultipliers: modXpMultipliers7k(mods),
				grade: score.grade,
				stars: sr,
				fatigue,
			}),
			strain: {
				minutes: length / 60_000,
				strained: playStrain(STRAINED_7K, bot, length),
			},
		};
	},
};
