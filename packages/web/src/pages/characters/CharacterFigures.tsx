import type { ReactNode } from 'react';
import { Trans } from '@lingui/react/macro';
import num from '@oss-idle/shared/display/num';
import accuracy from '@oss-idle/shared/display/accuracy';
import hitAccuracy from '@oss-idle/shared/osu/hitAccuracy';
import type { getCharacterStats } from '../../api/characters';

/** Ranked score, hit accuracy, total score and hits; `children` adds figures after them. */
export default function CharacterFigures({ stats, children }: {
	stats: Awaited<ReturnType<typeof getCharacterStats>>;
	children?: ReactNode;
}) {
	return (
		<div className='character__all_stats'>
			<div className='character__stats-area'>
				<div className='character__stats-label'><Trans>Ranked Score</Trans></div>
				<div className='character__stats-num'>{num(stats.rankedScore)}</div>
			</div>
			<div className='character__stats-area'>
				<div className='character__stats-label'><Trans>Hit Accuracy</Trans></div>
				<div className='character__stats-num'>{accuracy(hitAccuracy(stats))}</div>
			</div>
			<div className='character__stats-area'>
				<div className='character__stats-label'><Trans>Total Score</Trans></div>
				<div className='character__stats-num'>{num(stats.totalScore)}</div>
			</div>
			<div className='character__stats-area'>
				<div className='character__stats-label'><Trans>Total Hits</Trans></div>
				<div className='character__stats-num'>{num(stats.totalHits)}</div>
			</div>
			{children}
		</div>
	);
}
