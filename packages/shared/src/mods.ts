import { z } from 'zod';
import {
	JUDGEMENT,
	Judgements,
	type Judgement,
} from './judgement.js';
import {
	SKILL,
	Skills,
	type SkillName,
} from './skills.js';
import { rateLabel } from './rate.js';

/** osu!'s mods, the rate ones (Half/Double) left to rate.ts. In mod select order. */
export const Mods = ['EZ', 'NF', 'HR', 'SD', 'PF'] as const;
export type Mod = typeof Mods[number];

export const modsSchema = z.array(z.enum(Mods)).max(Mods.length);

/** Mods that can't be on together, as in osu!. */
const EXCLUSIVE: Mod[][] = [['EZ', 'HR'], ['NF', 'SD', 'PF']];

/** A play with one of these earns no xp and submits nothing. */
const UNRANKED: Mod[] = ['NF'];

/** osu!mania's EZ / HR hit window factor. */
const WINDOW_FACTOR = 1.4;

const SCORE_MULTIPLIER: Partial<Record<Mod, number>> = {
	EZ: 0.3,
	NF: 0.5,
};

const clash = (a: Mod, b: Mod): boolean =>
	EXCLUSIVE.some(set => set.includes(a) && set.includes(b));

/** Known mods, each once, conflicts dropped (the earlier one stays), in mod select order. */
export const cleanMods = (mods: readonly string[]): Mod[] => {
	const kept: Mod[] = [];
	for (const mod of mods) {
		if (!(Mods as readonly string[]).includes(mod) || kept.some(k => clash(k, mod as Mod))) continue;
		kept.push(mod as Mod);
	}
	return Mods.filter(m => kept.includes(m));
};

/** Turn a mod on or off; turning one on turns off what it can't go with. */
export const toggleMod = (mods: readonly Mod[], mod: Mod): Mod[] => mods.includes(mod)
	? mods.filter(m => m !== mod)
	: cleanMods([mod, ...mods]);

export const isRankedMods = (mods: readonly Mod[]): boolean =>
	!mods.some(m => UNRANKED.includes(m));

export const modsScoreMultiplier = (mods: readonly Mod[]): number =>
	mods.reduce((m, mod) => m * (SCORE_MULTIPLIER[mod] ?? 1), 1);

/** What every hit window is multiplied by. */
export const windowScale = (mods: readonly Mod[]): number =>
	mods.includes('EZ') ? WINDOW_FACTOR : mods.includes('HR') ? 1 / WINDOW_FACTOR : 1;

/** The worst judgement a play survives (SD: anything but a miss, PF: marvelous). */
export const worstAllowed = (mods: readonly Mod[]): Judgement | undefined =>
	mods.includes('PF') ? JUDGEMENT.MARVELOUS : mods.includes('SD') ? JUDGEMENT.BAD : undefined;

/** SD and PF play the map again on a fail. */
export const retriesOnFail = (mods: readonly Mod[]): boolean => worstAllowed(mods) !== undefined;

/** Whether `judgement` fails a play held to `worst`. */
export const failsOn = (judgement: Judgement, worst: Judgement | undefined): boolean =>
	worst !== undefined && Judgements.indexOf(judgement) > Judgements.indexOf(worst);

/** HR's small bonus on accuracy xp. */
export const HR_ACCURACY_XP = 1.1;
/** EZ's cut on every skill's xp. */
export const EZ_XP = 0.5;

/** What each skill's xp is multiplied by: NF earns nothing, EZ half, HR a bit more accuracy. */
export const modXpMultipliers = (mods: readonly Mod[]): Record<SkillName, number> => {
	const all = isRankedMods(mods) ? mods.includes('EZ') ? EZ_XP : 1 : 0;
	return Object.fromEntries(Skills.map(s => [
		s, s === SKILL.accuracy && mods.includes('HR') ? all * HR_ACCURACY_XP : all,
	])) as Record<SkillName, number>;
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

/** Mods whose plays earn none of the play medals (stars passed, full combos, the score
 *  feats...). A medal made for one of them can still read its plays. */
export const NO_MEDALS: Mod[] = ['EZ', 'NF'];

export const countsForMedals = (mods: readonly Mod[]): boolean =>
	!mods.some(m => NO_MEDALS.includes(m));

/** Mods as osu! writes them: HRSD. */
export const modsLabel = (mods: readonly Mod[]): string => mods.join('');

/** A play's mods with its rate, as song select's Mods button shows them: HRSD x1.2. */
export const playLabel = (mods: readonly Mod[], rate: number): string =>
	[modsLabel(mods), rate === 1 ? '' : rateLabel(rate)].filter(Boolean).join(' ');

/** Stored form: "HR,SD". */
export const modsKey = (mods: readonly Mod[]): string => cleanMods(mods).join(',');

export const parseMods = (key = ''): Mod[] => cleanMods(key.split(','));
