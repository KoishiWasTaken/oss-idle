import './RulesetSwitch.css';

import { rulesetLabel } from '@oss-idle/shared/rulesets/display';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import {
	ENABLED_RULESETS,
	RULESET_TABS,
} from '../../rulesets';
import Link from '../Link';


/** osu!'s profile mode switch: the profile in each ruleset, a star on the one played. */
export default function RulesetSwitch({ id, shown, picked }: {
	id: string,
	shown: RulesetId,
	picked: RulesetId,
}) {
	if (ENABLED_RULESETS.length < 2) return undefined;
	return (
		<nav className='ruleset-switch'>
			{RULESET_TABS.map(ruleset => (
				<Link
					key={ruleset}
					to='/c/$id'
					params={{ id }}
					search={{ ruleset: ruleset === picked ? undefined : ruleset }}
					className={`ruleset-switch__item${ruleset === shown ? ' ruleset-switch__item--active' : ''}`}
				>
					{ruleset === picked && <span className='ruleset-switch__star'>★</span>}
					{rulesetLabel(ruleset)}
				</Link>
			))}
		</nav>
	);
}
