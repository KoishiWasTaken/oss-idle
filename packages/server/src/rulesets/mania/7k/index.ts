import { mania7k } from '@oss-idle/shared/rulesets/mania/7k/index';
import {
	SKILL_7K,
	type SkillName7k,
} from '@oss-idle/shared/rulesets/mania/7k/skills';
import type { Judgement } from '@oss-idle/shared/rulesets/mania/judgement';
import { FORGET_PLAYS } from '@oss-idle/shared/rulesets/mania/memoryRecall';

import {
	forgetMemory,
	resetMemory,
} from '../../../db/schema/beatmaps_played';
import { serverRuleset } from '../../ruleset';
import { play } from './play';

export const ruleset = serverRuleset<Judgement, SkillName7k>(mania7k, play, {
	afterUpgrade: async (r, characterId, skill) => {
		if (skill === SKILL_7K.memory) await forgetMemory(r, characterId, FORGET_PLAYS);
	},
	afterPrestige: async (r, characterId, skill) => {
		if (skill === SKILL_7K.memory) await resetMemory(r, characterId);
	},
});
