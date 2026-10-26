import { osu } from '@oss-idle/shared/rulesets/osu/index';

import type { ClientRuleset } from '../ruleset';

/** Standard has no engine here yet: its maps aren't played on this device. */
export const ruleset: ClientRuleset = { def: osu };
