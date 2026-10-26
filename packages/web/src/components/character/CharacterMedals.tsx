import './CharacterMedals.css';

import { ph } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import {
	medalById,
	MedalCategories,
} from '@oss-idle/shared/achievements/catalogue';
import { medalCategoryName } from '@oss-idle/shared/display/medals';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import { getCharacterMedals } from '../../api/characters';
import { rulesetDef } from '../../rulesets';
import ProfileMedal from './ProfileMedal';

/** osu!'s profile medals: every medal by category, one series per line. */
export default function CharacterMedals({ id, ruleset }: { id: string, ruleset: RulesetId }) {
	const medals = useAsync(() => getCharacterMedals(id, ruleset), [id, ruleset]);
	const catalogue = rulesetDef(medals?.ruleset).medals;
	if (!medals) return null;
	const held = new Map(medals.held.map(m => [m.id, m.unlockedAt]));

	return <div className='character__block'>
		<div className='character__block-title'><Trans>Medals</Trans></div>
		<div className='profile-medals__count'>
			<Trans>{ph({ unlocked: medals.held.length })} / {ph({ total: catalogue.medals.length })} unlocked</Trans>
		</div>
		{MedalCategories.map(category => <div key={category} className='character__block-section'>
			<div className='character__block-section-title'>{medalCategoryName(category)}</div>
			<div className='profile-medals__lines'>
				{catalogue.lines[category].map(line => <div key={line[0]} className='profile-medals__line'>
					{line.flatMap(medalId => {
						const medal = medalById(catalogue, medalId);
						return medal
							? [<ProfileMedal
								key={medalId}
								medal={medal}
								unlockedAt={held.get(medalId)}
								progress={medals.progress[medalId]}
								holders={medals.holders.held[medalId] ?? 0}
								players={medals.holders.players}
							/>]
							: [];
					})}
				</div>)}
			</div>
		</div>)}
	</div>;
}
