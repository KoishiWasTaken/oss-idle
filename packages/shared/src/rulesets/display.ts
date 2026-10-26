import type { GlyphName } from '../achievements/glyphs.js';
import {
	type RulesetId,
	RULESETS,
} from './ids.js';

/** The osu! modes oss! has rulesets in. */
export type RulesetMode = typeof RULESETS[RulesetId]['mode'];

/** A mode's name: a brand, never translated. */
export const MODE_NAMES: Record<RulesetMode, string> = {
	mania: 'oss!mania',
	osu: 'oss!',
};

/** A ruleset's variant within its mode, as osu! writes it ("4K"); none for a mode of one. */
export const variantName = (id: RulesetId): string | undefined => {
	const r: { mode: string, variant?: string } = RULESETS[id];
	return r.variant?.toUpperCase();
};

/** How a ruleset is named where several sit side by side: its variant, else its mode. */
export const rulesetLabel = (id: RulesetId): string =>
	variantName(id) ?? MODE_NAMES[(RULESETS[id] as { mode: RulesetMode }).mode];

/** osu!'s mode icons: piano keys for mania, the numbered circle for standard. */
export const MODE_GLYPH: Record<RulesetMode, GlyphName> = {
	mania: 'pianoKeys',
	osu: 'numberCircleOne',
};
