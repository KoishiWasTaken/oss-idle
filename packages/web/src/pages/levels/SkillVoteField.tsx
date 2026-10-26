import { ph } from '@lingui/core/macro';
import {
	Plural,
	Trans,
	useLingui,
} from '@lingui/react/macro';
import {
	useEffect,
	useState,
} from 'react';

import {
	danOfLevel,
	median,
} from './levelScale';

const MAX_LEVEL = 500;

/** The viewer's level for one skill, saved when they leave the box,
 *  with the dan it reaches and the community's median. */
export default function SkillVoteField({
	name, levels, mine, canVote, onVote,
}: {
	name: string,
	levels: number[],
	mine: number | undefined,
	canVote: boolean,
	onVote: (level: number | undefined) => void,
}) {
	const { t } = useLingui();
	const [text, setText] = useState(mine?.toString() ?? '');
	useEffect(() => setText(mine?.toString() ?? ''), [mine]);

	const typed = Number(text);
	const valid = text !== '' && Number.isInteger(typed) && typed >= 1 && typed <= MAX_LEVEL;
	const commit = () => {
		if (text !== '' && !valid) return setText(mine?.toString() ?? '');
		const level = valid ? typed : undefined;
		if (level !== mine) onVote(level);
	};

	const med = median(levels);
	const dan = valid ? danOfLevel(typed) : undefined;

	return (<>
		<span className='skill-vote__row'>
			<input
				type='number'
				min={1}
				max={MAX_LEVEL}
				placeholder='?'
				value={text}
				disabled={!canVote}
				aria-label={name}
				onChange={e => setText(e.target.value)}
				onBlur={commit}
				onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
			/>
			<span className='skill-vote__dan'>
				{valid && (dan ? t`dan ${ph({ dan })}` : t`below dan 1`)}
			</span>
		</span>
		<span className='skill-vote__community'>
			{med === undefined
				? t`no votes yet`
				: <Trans>
					median <b>{ph({ median: Math.round(med) })}</b> · <Plural
						value={ph({ votes: levels.length })}
						one='# vote'
						other='# votes'
					/>
				</Trans>}
		</span>
	</>);
}
