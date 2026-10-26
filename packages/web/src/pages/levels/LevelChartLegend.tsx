import { Trans } from '@lingui/react/macro';

import type { VoteSkill } from './skill';

/** The skills, each one clicked to hide or show it on the chart. */
export default function LevelChartLegend({ skills, hidden, onToggle }: {
	skills: VoteSkill[],
	hidden: Set<string>,
	onToggle: (key: string) => void,
}) {
	return (<div className='level-chart__legend'>
		{skills.map(s => <button
			key={s.key}
			className={hidden.has(s.key) ? 'is-hidden' : ''}
			onClick={() => onToggle(s.key)}
		>
			<i style={{ background: s.color }} />{s.name}
		</button>)}
		<span><i className='level-chart__ring' /><Trans>your vote</Trans></span>
		<span><i className='level-chart__bar' /><Trans>middle half of votes</Trans></span>
	</div>);
}
