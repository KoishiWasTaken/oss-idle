import './Bugs.css';

import { Trans } from '@lingui/react/macro';
import {
	useEffect,
	useState,
} from 'react';

import {
	type BugRow,
	myBugs,
} from '../../api/bugs';
import Link from '../../components/Link';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import BugList from './BugList';

/** The player's own bug reports. */
export default function MyBugs() {
	const user = useCurrentUser();
	const [bugs, setBugs] = useState<BugRow[]>();

	useEffect(() => {
		if (user) void myBugs().then(setBugs);
	}, [user]);

	if (!user) return <div className='page-contents'><Trans>Sign in to report a bug.</Trans></div>;

	return <div className='page-contents bugs'>
		<div className='bugs__head'>
			<Link to='/bugs/new' className='bugs__btn bugs__btn--accent'><Trans>Report a bug</Trans></Link>
		</div>
		{bugs && !bugs.length && <p className='bugs__muted'>
			<Trans>You haven't reported any bug yet.</Trans>
		</p>}
		{bugs && <BugList bugs={bugs} />}
	</div>;
}
