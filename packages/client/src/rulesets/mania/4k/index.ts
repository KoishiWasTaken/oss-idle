import { mania4k } from '@oss-idle/shared/rulesets/mania/4k/index';

import type { ClientRuleset } from '../../ruleset';
import { maniaProgression } from '../progression';

export const ruleset: ClientRuleset = {
	def: mania4k,
	progression: maniaProgression,
	player: async () => (await import('./player')).player4k,
};
