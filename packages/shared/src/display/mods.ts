import type { GlyphName } from '../achievements/glyphs.js';
import {
	__,
	defineMessages,
} from '../i18n/translate.js';
import type { Mod } from '../mods.js';

const MOD_NAMES = defineMessages({
	EZ: 'Easy',
	NF: 'No Fail',
	HR: 'Hard Rock',
	SD: 'Sudden Death',
	PF: 'Perfect',
} satisfies Record<Mod, string>);

export const modName = (mod: Mod): string => __(MOD_NAMES[mod]);

/** Each mod's tile: its glyph and osu!'s colour for it. */
export const MOD_LOOK = {
	EZ: {
		glyph: 'plant', tint: '#4caf50',
	},
	NF: {
		glyph: 'heartbeat', tint: '#3d8fd6',
	},
	HR: {
		glyph: 'mountains', tint: '#d9413a',
	},
	SD: {
		glyph: 'skull', tint: '#e0761f',
	},
	PF: {
		glyph: 'sealCheck', tint: '#e2b81f',
	},
} as const satisfies Record<Mod, { glyph: GlyphName, tint: string }>;
