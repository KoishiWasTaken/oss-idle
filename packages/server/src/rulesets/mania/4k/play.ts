import '@oss-idle/shared/osu/controlPointPatch';

import type { Beatmap } from 'osu-classes';
import { BeatmapDecoder } from 'osu-parsers';

import { warmupTrend } from '@oss-idle/shared/fatigue';
import { type Mod } from '@oss-idle/shared/mods';
import { allowedRate } from '@oss-idle/shared/rate';
import { hasUnlock } from '@oss-idle/shared/rebirth';
import CharacterBot from '@oss-idle/shared/rulesets/mania/4k/bots/character';
import { modXpMultipliers } from '@oss-idle/shared/rulesets/mania/4k/modXp';
import {
	MINDBLOCK_SKILLS,
	PHYSICAL_SKILLS,
	SKILL,
} from '@oss-idle/shared/rulesets/mania/4k/skills';
import { makeOrderedSkills } from '@oss-idle/shared/rulesets/mania/4k/skills/factory';
import Memory from '@oss-idle/shared/rulesets/mania/4k/skills/memory';
import { tireSkill } from '@oss-idle/shared/rulesets/mania/4k/tiring';
import type { ScoreState } from '@oss-idle/shared/rulesets/mania/scoring';
import { xpScore } from '@oss-idle/shared/rulesets/mania/xpScore';

import { getPlays } from '../../../db/schema/beatmaps_played';
import {
	type ProfileRow,
	skillOf,
} from '../../../db/schema/character';
import type { RulesetPlay } from '../../play';
import type { ServerRuleset } from '../../ruleset';
import {
	playStrain,
	serverXp,
	tiredness,
} from '../playRules';
import { runManiaPlay } from '../simulate';

const decoder = new BeatmapDecoder();

// Notes where no physical skill strains past its threshold add no fatigue.
// Coordination rests around 0.15-0.2 on LN maps, so it counts from higher up.
export const STRAINED_4K = {
	...Object.fromEntries(PHYSICAL_SKILLS.map(skill => [skill, 0.2])),
	coordination: 0.3,
};

/** Build the character's skills, loaded with their level/XP (and play count for
 *  Memory) so the simulation runs at the character's current state, tired. */
export async function loadCharacterSkills(
	r: ServerRuleset,
	profile: ProfileRow,
	beatmapId: number,
	/** how tired the character is, 0 rested to 1 exhausted */
	fatigue = 0,
	/** how warmed up, 0 cold to 1 warm */
	warm = 1,
) {
	const skills = makeOrderedSkills();
	for (const skill of skills) {
		const columns = skillOf(profile, skill.name);
		skill.level.set(columns.level);
		skill.xp.set(columns.xp);
		skill.upgrades.set(columns.upgrades);
		skill.overdrive.set(columns.overdrive);
		skill.prestige.set(columns.prestige);
		tireSkill(skill, fatigue, warm);

		if (skill instanceof Memory) {
			skill.timesPlayed.set(await getPlays(r, profile.id, beatmapId));
		}
	}
	return skills;
}

/** The xp a finished play is worth: mindblock and the bonus for a first X.
 *  Exported so the score replay awards xp by the same rules a live play does,
 *  rather than keeping a second copy of them. */
export const getServerXP = async (
	r: ServerRuleset,
	characterId: number,
	beatmapId: number,
	bot: CharacterBot,
	chart: Beatmap,
	score: ScoreState,
	rate = 1,
	/** the map's stars at that rate */
	stars: number,
	mods: readonly Mod[] = [],
	fatigue = 0,
) => {
	// the play's real duration: a rate shortens or stretches it
	const skillXp = bot.getSkillsXP(chart.totalLength / rate, score);
	return serverXp(r, characterId, beatmapId, skillXp, {
		mindblock: MINDBLOCK_SKILLS,
		modMultipliers: modXpMultipliers(mods),
		grade: score.grade,
		stars,
		fatigue,
	});
};

export const play: RulesetPlay = {
	tiredness: tiredness(SKILL.stamina),
	allowedRate: (profile, rate) => allowedRate(rate, skillOf(profile, 'speed').upgrades),
	warmupTrend: ({ minutes, strained }) => warmupTrend(minutes, strained),
	async simulate(r, {
		profile, beatmapId, chart: text, sr, rate, mods, round, board, tired,
	}) {
		const { fatigue, warmup: warm } = tired;
		const skills = await loadCharacterSkills(r, profile, beatmapId, fatigue, warm);
		const chart = decoder.decodeFromString(text);
		const bot = new CharacterBot(skills);
		const options = {
			divine: hasUnlock(profile.generation, 'DIVINE'), rate, mods, playOn: round,
		};
		const { game, played } = runManiaPlay(chart, bot, options, round);
		if (board) return {
			...played, skillXp: Object.fromEntries(r.def.skills.map(s => [s, 0])),
		};
		const length = chart.totalLength / rate;
		return {
			...played,
			skillXp: await getServerXP(
				r, profile.id, beatmapId, bot, chart, xpScore(chart, game, options), rate, sr, mods, fatigue,
			),
			strain: {
				minutes: length / 60_000,
				strained: playStrain(STRAINED_4K, bot, length),
			},
		};
	},
};
