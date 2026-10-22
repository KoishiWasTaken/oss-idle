import type { ReactNode } from 'react';
import rank from '@oss-idle/shared/display/rank';
import { useLingui } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import './RankArea.css';

/** One profile rank, with the highest rank reached on its board on hover. */
export default function RankArea({ label, current, highest }: {
	label: ReactNode;
	current?: number;
	highest?: { rank: number; at: number };
}) {
	const { t, i18n } = useLingui();
	const date = highest ? i18n.date(new Date(highest.at), { dateStyle: 'long' }) : '';
	return (
		<div className='character__ranks-area rank-area'>
			<div className='character__ranks-label'>{label}</div>
			<div className='character__ranks-num'>{rank(current)}</div>
			{highest && (
				<div className='rank-area__tooltip'>
					{t`Highest rank: ${ph({ rank: rank(highest.rank) })} on ${ph({ date })}`}
				</div>
			)}
		</div>
	);
}
