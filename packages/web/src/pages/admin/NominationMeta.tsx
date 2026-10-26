import { osuSetUrl } from '@oss-idle/shared/beatmap';

import type { Nomination } from '../../api/maps';
import Link from '../../components/Link';

/** A queue entry's title - to its osu! page, or ours for a player's own map - its
 *  mapper, and who asked for it or submitted it. */
export default function NominationMeta({ row, player }: { row: Nomination, player: boolean }) {
	return (
		<div className='nomination__meta'>
			{player
				? <Link className='nomination__title' to='/maps/$id' params={{ id: String(row.id) }}>
					{row.artist} - {row.title}
				</Link>
				: <a
					className='nomination__title'
					href={osuSetUrl(row.osuId)}
					target='_blank'
					rel='noreferrer'
				>
					{row.artist} - {row.title}
				</a>}
			<span className='nomination__creator'>by {row.creator}</span>
			{player && <span className='nomination__creator'>submitted by {row.submittedBy}</span>}
			{row.requestedBy && (
				<span className='nomination__creator'>requested by {row.requestedBy.username}</span>
			)}
		</div>
	);
}
