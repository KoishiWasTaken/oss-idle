import { MEDAL_XP_BONUS } from '../upgrades.js';
import type { GlyphName } from './glyphs.js';
import type {
	MedalLook,
	MedalShape,
	MedalTier,
} from './medal.js';

export const MedalCategories = ['skill', 'dedication', 'mastery', 'ranked', 'secret'] as const;
export type MedalCategory = (typeof MedalCategories)[number];

const LOOKS: Record<MedalCategory, { shape: MedalShape, hue: number }> = {
	skill: {
		shape: 'hexagon', hue: 205,
	},
	dedication: {
		shape: 'circle', hue: 275,
	},
	mastery: {
		shape: 'octagon', hue: 10,
	},
	ranked: {
		shape: 'diamond', hue: 150,
	},
	secret: {
		shape: 'circle', hue: 320,
	},
};

export type MedalDef = {
	id: string,
	category: MedalCategory,
	tier: MedalTier,
	glyph: GlyphName,
};

export const medalLook = ({
	category, tier, glyph,
}: MedalDef): MedalLook => ({
	...LOOKS[category], tier, glyph,
});

/** A medal of a ruleset's catalogue. Ids are unique across rulesets: a title is any of them. */
export const medalDef = (
	id: string,
	category: MedalCategory,
	tier: MedalTier,
	glyph: GlyphName,
): MedalDef => ({
	id, category, tier, glyph,
});

/** A ruleset's medals, and how its categories read as rows. */
export type MedalCatalogue = {
	medals: readonly MedalDef[],
	lines: Record<MedalCategory, string[][]>,
	/** what its ids start with, past which the medal rules read them (`7k-pass-1` is pass-1) */
	prefix: string,
	/** a medal's localized name and description, by id */
	name(id: string): string,
	description(id: string): string,
};

const byId = new WeakMap<MedalCatalogue, Map<string, MedalDef>>();
const indexOf = (catalogue: MedalCatalogue) => {
	let index = byId.get(catalogue);
	if (!index) byId.set(catalogue, index = new Map(catalogue.medals.map(m => [m.id, m])));
	return index;
};

export const medalById = (catalogue: MedalCatalogue, id: string): MedalDef | undefined =>
	indexOf(catalogue).get(id);

/** XP-gain multiplier from the medals held: each one compounds its tier bonus. */
export const medalXPMultiplier = (catalogue: MedalCatalogue, ids: readonly string[]): number =>
	ids.reduce((product, id) => {
		const medal = medalById(catalogue, id);
		return medal ? product * (1 + MEDAL_XP_BONUS[medal.tier]) : product;
	}, 1);

/** The medal ranking's value: each medal held weighs what its tier adds to xp,
 *  counted in bronze medals. */
export const medalWeight = (catalogue: MedalCatalogue, ids: readonly string[]): number =>
	ids.reduce((sum, id) => {
		const medal = medalById(catalogue, id);
		return medal ? sum + MEDAL_XP_BONUS[medal.tier] / MEDAL_XP_BONUS.bronze : sum;
	}, 0);

/** The catalogue among `catalogues` that holds medal `id`. */
export const catalogueOf = (
	catalogues: readonly MedalCatalogue[],
	id: string,
): MedalCatalogue | undefined => catalogues.find(c => medalById(c, id));
