import {
	difficultyColor,
	starsText,
} from '@oss-idle/shared/display/difficulty';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import type { MapDiff } from '../../api/maps';
import Link from '../../components/Link';
import ModeIcon from '../../components/ModeIcon';

/** One mode icon per difficulty, coloured by star rating, like osu!'s picker. */
export default function DifficultyPicker({ setId, ruleset, diffs, current }: {
	setId: number;
	ruleset: RulesetId;
	diffs: MapDiff[];
	current: number;
}) {
	return <div className='mapset__picker'>
		{diffs.map(d => <Link
			key={d.id}
			to='/maps/$id'
			params={{ id: String(setId) }}
			search={{
				ruleset, diff: d.id,
			}}
			resetScroll={false}
			className={`mapset__picker-diff ${d.id === current ? 'active' : ''}`}
			title={`${d.version} (${starsText(d.sr)}★)`}
		>
			<span style={{ color: difficultyColor(d.sr) }}><ModeIcon ruleset={ruleset} /></span>
		</Link>)}
	</div>;
}
