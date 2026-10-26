import {
	evenModXp,
	type Mod,
} from '../../../mods.js';
import {
	SKILL,
	type SkillName,
	Skills,
} from './skills.js';

/** HR's small bonus on accuracy xp. */
export const HR_ACCURACY_XP = 1.1;

/** What each skill's xp is multiplied by: NF earns nothing, EZ half, HR a bit more accuracy. */
export const modXpMultipliers = (mods: readonly Mod[]): Record<SkillName, number> => {
	const multipliers = evenModXp(Skills, mods);
	if (mods.includes('HR')) multipliers[SKILL.accuracy] *= HR_ACCURACY_XP;
	return multipliers;
};

/** The mods on top of a play's xp (read off `xpScore`, so the windows alone move nothing). */
export const modXp = (
	xp: Record<SkillName, number>,
	mods: readonly Mod[],
): Record<SkillName, number> => {
	const multipliers = modXpMultipliers(mods);
	for (const name of Object.keys(xp) as SkillName[]) {
		xp[name] = Math.floor(xp[name] * multipliers[name]);
	}
	return xp;
};
