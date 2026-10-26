import {
	evenModXp,
	type Mod,
} from '../../../mods.js';
import {
	SKILL_7K,
	type SkillName7k,
	Skills7k,
} from './skills.js';

/** HR's small bonus on accuracy xp. */
export const HR_ACCURACY_XP_7K = 1.1;

/** What each skill's xp is multiplied by: NF earns nothing, EZ half, HR a bit more accuracy. */
export const modXpMultipliers7k = (mods: readonly Mod[]): Record<SkillName7k, number> => {
	const multipliers = evenModXp(Skills7k, mods);
	if (mods.includes('HR')) multipliers[SKILL_7K.accuracy] *= HR_ACCURACY_XP_7K;
	return multipliers;
};
