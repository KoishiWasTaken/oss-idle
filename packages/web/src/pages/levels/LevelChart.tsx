import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import type { LevelMap } from '../../api/levelVotes';
import LevelChartLegend from './LevelChartLegend';
import {
	DANS,
	median,
	quartiles,
} from './levelScale';
import type { VoteSkill } from './skill';

const MIN = 20;
const MAX = DANS.at(-1)!.level + 5;
const LEFT = 220;
const WIDTH = 900;
const TOP = 28;
const SPACING = 5;

const LABEL_LENGTH = 30;

const label = (map: LevelMap) => {
	const text = `${map.title} [${map.version}]`;
	return text.length > LABEL_LENGTH ? `${text.slice(0, LABEL_LENGTH - 1)}…` : text;
};

const x = (level: number) =>
	LEFT + (Math.min(Math.max(level, MIN), MAX) - MIN) / (MAX - MIN) * (WIDTH - LEFT - 10);

/** Each map's median vote per skill against the dan scale,
 *  with the middle half of the votes and the viewer's own. */
export default function LevelChart({ maps, skills }: { maps: LevelMap[], skills: VoteSkill[] }) {
	const { t } = useLingui();
	const [hidden, setHidden] = useState(new Set<string>());
	const shown = skills.filter(s => !hidden.has(s.key) && maps.some(m => m.levels[s.key]?.length));
	const row = Math.max(30, shown.length * SPACING + 14);
	const height = TOP + maps.length * row + 10;

	const toggle = (key: string) => setHidden(prev => {
		const next = new Set(prev);
		if (!next.delete(key)) next.add(key);
		return next;
	});

	return (<div className='level-chart'>
		<LevelChartLegend skills={skills} hidden={hidden} onToggle={toggle} />
		<svg
			viewBox={`0 0 ${WIDTH} ${height}`}
			role='img'
			aria-label={t`Median votes per map and skill, against the dans`}
		>
			{DANS.map(d => <g key={d.name}>
				<line x1={x(d.level)} x2={x(d.level)} y1={TOP - 6} y2={height} className='level-chart__grid' />
				<text x={x(d.level)} y={TOP - 12} className='level-chart__dan'>{d.name}</text>
			</g>)}
			{maps.map((m, i) => {
				const cy = TOP + i * row + row / 2;
				return <g key={m.beatmapId}>
					<text x={LEFT - 12} y={m.target ? cy - 2 : cy + 4} className='level-chart__label'>
						{label(m)}
					</text>
					{m.target && <text x={LEFT - 12} y={cy + 11} className='level-chart__target'>
						{m.target}
					</text>}
					{shown.map((s, j) => {
						const levels = m.levels[s.key] ?? [];
						const med = median(levels);
						if (med === undefined) return undefined;
						const y = cy + (j - (shown.length - 1) / 2) * SPACING;
						const iqr = quartiles(levels);
						const own = m.mine[s.key];
						return <g key={s.key}>
							{iqr && <line
								x1={x(iqr[0])}
								x2={x(iqr[1])}
								y1={y}
								y2={y}
								stroke={s.color}
								strokeOpacity={.35}
								strokeWidth={4}
								strokeLinecap='round'
							/>}
							<circle cx={x(med)} cy={y} r={3.5} fill={s.color} />
							{own !== undefined && <circle
								cx={x(own)}
								cy={y}
								r={5.5}
								fill='none'
								stroke={s.color}
								strokeWidth={1.5}
							/>}
						</g>;
					})}
				</g>;
			})}
		</svg>
	</div>);
}
