import { useLingui } from '@lingui/react/macro';

import { dateAgo } from '@oss-idle/shared/display/ago';

import type { BugRow } from '../../api/bugs';
import Link from '../../components/Link';
import BugStatusPill from './BugStatusPill';

/** Reports as rows; `team` adds the reporter and marks the ones awaiting a reply. */
export default function BugList({ bugs, team }: { bugs: BugRow[]; team?: boolean }) {
	const { t } = useLingui();
	return <div className='bug-list'>
		{bugs.map(b => <Link
			key={b.id}
			to='/bugs/$id'
			params={{ id: String(b.id) }}
			className='bug-list__row'
		>
			<BugStatusPill status={b.status} />
			<span className='bug-list__title'>{b.title}</span>
			{team && <span className='bug-list__meta'>{b.reporter.name}</span>}
			<span className='bug-list__meta'>#{b.id} · {dateAgo(b.updatedAt)}</span>
			{(team ? !b.lastByTeam : b.unread) && <span className='bug-list__new'>
				{team ? t`awaiting reply` : t`new answer`}
			</span>}
		</Link>)}
	</div>;
}
