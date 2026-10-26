import type { MedalCatalogue } from '../achievements/catalogue.js';

/** A ruleset with no medals yet. */
export const NO_MEDALS: MedalCatalogue = {
	medals: [],
	lines: {
		skill: [], dedication: [], mastery: [], ranked: [], secret: [],
	},
	prefix: '',
	name: id => id,
	description: () => '',
};
