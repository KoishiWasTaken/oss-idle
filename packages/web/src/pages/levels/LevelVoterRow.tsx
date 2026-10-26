import { ph } from '@lingui/core/macro';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useState } from 'react';

import Link from '../../components/Link';
import type { VoteSkill } from './skill';
import type { Voter } from './voters';

export default function LevelVoterRow({ voter, skills, onRemove, onRemoveEverywhere }: {
	voter: Voter,
	skills: VoteSkill[],
	onRemove: () => void,
	onRemoveEverywhere: () => void,
}) {
	const { t } = useLingui();
	const [confirming, setConfirming] = useState(false);

	return (<div className={`level-voter ${voter.restricted ? 'is-restricted' : ''}`}>
		<span className='level-voter__name'>
			{voter.characterId
				? <Link to='/c/$id' params={{ id: String(voter.characterId) }}>{voter.name}</Link>
				: voter.name}
			{voter.restricted && <span className='level-voter__badge'>{t`restricted`}</span>}
		</span>
		<span className='level-voter__offset'>
			<Trans>±{ph({ offset: Math.round(voter.offset) })} from the median</Trans>
		</span>
		<span className='level-voter__levels'>
			{skills.filter(s => voter.levels[s.key] !== undefined).map(s => (
				<span key={s.key} style={{ color: s.color }}>{s.name} {voter.levels[s.key]}</span>
			))}
		</span>
		<span className='level-voter__actions'>
			<button onClick={onRemove}>{t`remove`}</button>
			<button
				className={confirming ? 'is-confirming' : ''}
				onClick={() => confirming ? onRemoveEverywhere() : setConfirming(true)}
				onBlur={() => setConfirming(false)}
			>
				{confirming ? t`sure? remove on every map` : t`remove on every map`}
			</button>
		</span>
	</div>);
}
