import { rulesetLabel } from '@oss-idle/shared/rulesets/display';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import type { Mapset } from '../../api/maps';
import Link from '../../components/Link';
import ModeIcon from '../../components/ModeIcon';
import {
	ENABLED_RULESETS,
	RULESET_TABS,
} from '../../rulesets';

/** osu!'s mode tabs over a set's difficulties: each ruleset with how many it has there,
 *  the ones it has none in greyed out. */
export default function MapsetRulesetTabs({ setId, current, rulesets }: {
	setId: number,
	current: RulesetId,
	rulesets: Mapset['rulesets'],
}) {
	if (ENABLED_RULESETS.length < 2) return null;
	return <div className='mapset__modes'>
		{RULESET_TABS.map(ruleset => {
			const diffs = rulesets.find(r => r.ruleset === ruleset)?.diffs ?? 0;
			const content = <>
				<ModeIcon ruleset={ruleset} />
				{rulesetLabel(ruleset)}
				<span className='mapset__mode-count'>{diffs}</span>
			</>;
			if (!diffs) return <span key={ruleset} className='mapset__mode is-empty'>{content}</span>;
			return <Link
				key={ruleset}
				to='/maps/$id'
				params={{ id: String(setId) }}
				search={{ ruleset }}
				resetScroll={false}
				className={`mapset__mode ${ruleset === current ? 'active' : ''}`}
			>
				{content}
			</Link>;
		})}
	</div>;
}
