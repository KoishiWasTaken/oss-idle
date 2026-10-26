import SkillState from '@oss-idle/shared/rulesets/skillState';
import {
	maxUpgrades,
	overdriveMultiplier,
	prestigeXPMultiplier,
	UPGRADE_XP_BONUS,
	upgradeXPMultiplier,
} from '@oss-idle/shared/upgrades';

export type MedalBoost = { held: number, multiplier: number };

/** Everything a skill's XP multiplier is made of. Guests have no medals. */
export const skillStats = (skill: SkillState, medals?: MedalBoost) => {
	const upgrades = skill.upgrades.get();
	const overdrive = skill.overdrive.get();
	const prestige = skill.prestige.get();
	const upgradeBoost = upgradeXPMultiplier(upgrades, overdrive);
	const prestigeBoost = prestigeXPMultiplier(prestige);
	return {
		skill,
		level: skill.level.get(),
		xp: skill.xp.get(),
		upgrades,
		max: maxUpgrades(prestige),
		upgradePercent: Math.round(upgrades * UPGRADE_XP_BONUS * 100),
		overdrive,
		overdriveBoost: overdriveMultiplier(overdrive),
		upgradeBoost,
		prestige,
		prestigeBoost,
		medals,
		total: upgradeBoost * prestigeBoost * (medals?.multiplier ?? 1),
	};
};

export type SkillStats = ReturnType<typeof skillStats>;

export const x = (n: number) => `x${n.toFixed(2)}`;
