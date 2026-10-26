import { i18n } from '@lingui/core';
import {
	describe,
	expect,
	it,
} from 'vitest';

import type { MedalCatalogue } from '@oss-idle/shared/achievements/catalogue';
import { GLYPHS } from '@oss-idle/shared/achievements/glyphs';
import { mania4k } from '@oss-idle/shared/rulesets/mania/4k/index';
import { mania7k } from '@oss-idle/shared/rulesets/mania/7k/index';

i18n.loadAndActivate({
	locale: 'en', messages: {},
});

describe.each([mania4k, mania7k])('$id', ({ medals: catalogue }: { medals: MedalCatalogue }) => {
	const { medals: MEDALS, lines: MEDAL_LINES, prefix } = catalogue;

	it('gives every medal a unique id, a glyph, a name and a description', () => {
		expect(new Set(MEDALS.map(m => m.id)).size).toBe(MEDALS.length);
		for (const medal of MEDALS) {
			expect(GLYPHS[medal.glyph]).toBeTruthy();
			expect(catalogue.name(medal.id)).toBeTruthy();
			expect(catalogue.description(medal.id)).toBeTruthy();
		}
	});

	it('lays every medal out on exactly one profile line, in its own category', () => {
		const placed = Object.entries(MEDAL_LINES).flatMap(([category, lines]) =>
			lines.flat().map(id => ({
				id, category,
			})));
		expect(placed.map(p => p.id).sort()).toEqual(MEDALS.map(m => m.id).sort());
		for (const { id, category } of placed) {
			expect(MEDALS.find(m => m.id === id)?.category).toBe(category);
		}
	});

	it('keeps every id under the ruleset\'s prefix', () => {
		for (const medal of MEDALS) expect(medal.id.startsWith(prefix)).toBe(true);
	});
});

it('never gives two rulesets the same medal id', () => {
	const ids4k = new Set(mania4k.medals.medals.map(m => m.id));
	expect(mania7k.medals.medals.filter(m => ids4k.has(m.id))).toEqual([]);
});
