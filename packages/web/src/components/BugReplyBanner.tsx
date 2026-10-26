import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useRouterState } from '@tanstack/react-router';
import {
	useEffect,
	useState,
} from 'react';

import { unreadBugs } from '../api/bugs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import Link from './Link';
import NotificationBanner from './NotificationBanner';

type Unread = Awaited<ReturnType<typeof unreadBugs>>;

/** On every page while the team answered one of the player's bug reports they haven't opened. */
export default function BugReplyBanner() {
	const { t } = useLingui();
	const me = useCurrentUser();
	const pathname = useRouterState({ select: s => s.location.pathname });
	const [unread, setUnread] = useState<Unread>([]);

	useEffect(() => {
		if (!me) return setUnread([]);
		void unreadBugs().then(setUnread, () => setUnread([]));
	}, [me, pathname]);

	if (!unread.length) return null;
	return <NotificationBanner type={t`bug report`} title={<Trans>The team answered you!</Trans>}>
		{unread.map((b, i) => <span key={b.id}>
			{i > 0 && ', '}
			<Link to='/bugs/$id' params={{ id: String(b.id) }}>{b.title}</Link>
		</span>)}
	</NotificationBanner>;
}
