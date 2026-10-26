import {
	type RulesetId,
	RULESETS,
} from '@oss-idle/shared/rulesets/ids';

import ManiaIcon from './ManiaIcon';
import OsuIcon from './OsuIcon';

/** A ruleset's mode mark, as osu! draws one beside each difficulty. */
export default function ModeIcon({ ruleset }: { ruleset: RulesetId }) {
	return RULESETS[ruleset].mode === 'osu' ? <OsuIcon /> : <ManiaIcon />;
}
