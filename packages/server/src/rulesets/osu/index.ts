import {
	osu,
	type OsuJudgement,
	type OsuSkill,
} from '@oss-idle/shared/rulesets/osu/index';

import { serverRuleset } from '../ruleset';

/** osu!standard has no engine yet: its maps are listed, a play of one is refused. */
export const ruleset = serverRuleset<OsuJudgement, OsuSkill>(osu, {
	tiredness: () => ({
		fatigue: 0, warmup: 1, warmupBar: 0,
	}),
	allowedRate: () => 1,
	warmupTrend: () => 0,
	simulate: () => Promise.reject(new Error('osu!standard has no engine yet')),
});
