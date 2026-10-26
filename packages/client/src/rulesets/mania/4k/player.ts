import num from '@oss-idle/shared/display/num';
import type { SkillGain } from '@oss-idle/shared/play';
import CharacterBot from '@oss-idle/shared/rulesets/mania/4k/bots/character';
import { mania4k } from '@oss-idle/shared/rulesets/mania/4k/index';
import {
	SKILL,
	Skills,
} from '@oss-idle/shared/rulesets/mania/4k/skills';
import { makeOrderedSkills } from '@oss-idle/shared/rulesets/mania/4k/skills/factory';
import Memory from '@oss-idle/shared/rulesets/mania/4k/skills/memory';
import Reading from '@oss-idle/shared/rulesets/mania/4k/skills/reading';
import Speed from '@oss-idle/shared/rulesets/mania/4k/skills/speed';
import { tireSkill } from '@oss-idle/shared/rulesets/mania/4k/tiring';
import { xpScore } from '@oss-idle/shared/rulesets/mania/xpScore';
import type SkillState from '@oss-idle/shared/rulesets/skillState';

import type { Tiredness } from '../../../online/localPlay';
import type {
	FinishedPlay,
	ManiaPlayer,
	PlayBot,
} from '../../ruleset';

class Bot4k extends CharacterBot implements PlayBot {
	gains({ chart, game, length, rate, mods, divine, multiplier }: FinishedPlay): SkillGain[] {
		return this.applyProgression(length, xpScore(chart, game, {
			divine, rate, mods,
		}), multiplier, mods);
	}
}

/** 4K's skills at `skills`' progression, memory at `timesPlayed`, tired as given. */
const copyOf = (skills: readonly SkillState[], timesPlayed: number, tired?: Tiredness) =>
	makeOrderedSkills().map(skill => {
		const live = skills.find(s => s.name === skill.name);
		if (live) skill.apply(live.state());
		if (skill instanceof Memory) void skill.timesPlayed.set(timesPlayed);
		if (tired) tireSkill(skill, tired.fatigue, tired.warmup);
		return skill;
	});

/** Skill level the debug bot runs at - shared by the strain analysis and the
 *  debug play launched from the strain view, so they match. */
export const DEBUG_BOT_LEVEL = 0;

// accuracy is a level constant; memory has no press strain of its own (it only
// reduces SpeedJam's)
const UNGAUGED = new Set<string>([SKILL.accuracy, SKILL.memory, SKILL.consistency]);
const GAUGED = Skills.filter(s => !UNGAUGED.has(s));

export const player4k: ManiaPlayer = {
	bot: (skills, timesPlayed, tired) => new Bot4k(copyOf(skills, timesPlayed, tired)),
	debugBot: () => new Bot4k(makeOrderedSkills(DEBUG_BOT_LEVEL)),
	strainGauges: () => GAUGED.map(skill => ({
		skill, label: mania4k.skillName(skill),
	})),
	debugStats: (game, now) => [
		`${Reading.countTransitions(new Map(), game.visibleNotesAt(now))}t`,
		`${num(Speed.weightedGroups(new Map(), game.recentNotes(now)), 2)}g`,
	],
};
