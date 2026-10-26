import cubic_bezier from './math/cubic_bezier.js';

const progressionCurve = cubic_bezier(.1, .4, .95, 0);
const lateProgressionCurve = cubic_bezier(.5, 0, 1, .4);

export const LATE_LEVEL_XP = 10_000_000;

export const lateLevelXp = (level: number): number => {
	if (level < 100) return 0;
	const steps = level - 99;
	return steps * (steps + 1) / 2 * LATE_LEVEL_XP;
};

export const xpForLevel = (level: number): number => {
	return 100
		+ (progressionCurve(level / 100) * 9900)
		+ (lateProgressionCurve((level - 60) / 40) * 90000)
		+ lateLevelXp(level);
};

export const xpToLevel = (level: number): number => {
	let total = 0;
	for (let i = 0; i < level; i++) {
		total += xpForLevel(i);
	}
	return total;
};

export const xpGivesLevel = (xp: number): { level: number, xp: number } => {
	let level = 0;
	do {
		const nextXP = xpForLevel(level);
		if (xp < nextXP) break;
		xp -= nextXP;
		level++;
	} while(true);
	
	return {
		level,
		xp,
	};
};

/** `gained` xp added on top of `xp` into `level`: where it lands, and how many levels it crossed. */
export const gainLevels = (level: number, xp: number, gained: number) => {
	xp += gained;
	let levels = 0;
	while (xp > xpForLevel(level)) {
		xp -= xpForLevel(level);
		level++;
		levels++;
	}
	return {
		level, xp, levels,
	};
};

/** Progress through a level, as a fraction of what the next one costs. */
export const levelProgress = (level: number, xp: number): number => {
	const needed = xpForLevel(level);
	if (!(needed > 0)) return 0;
	return Math.min(1, Math.max(0, xp / needed));
};

/** The level the player is shown: their xp level and its progress plus any
 *  prestige bonus. A ruleset's sim may map it further - that never reaches the display. */
export const effectiveLevelOf = (level: number, xp: number, prestige = 0): number =>
	level + levelProgress(level, xp) + prestige;
