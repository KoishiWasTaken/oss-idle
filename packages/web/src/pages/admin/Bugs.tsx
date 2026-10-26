import '../bugs/Bugs.css';

import {
	useEffect,
	useState,
} from 'react';

import {
	BUG_STATUS,
	type BugStatus,
} from '@oss-idle/shared/bugs';

import {
	allBugs,
	type BugRow,
} from '../../api/bugs';
import BugList from '../bugs/BugList';
import BugStatusPill from '../bugs/BugStatusPill';

/** Every player's bug reports; Claude reads and answers the same ones with `npm -w @oss-idle/server run bugs`. */
export default function Bugs() {
	const [statuses, setStatuses] = useState<BugStatus[]>(['open', 'confirmed']);
	const [bugs, setBugs] = useState<BugRow[]>();

	useEffect(() => {
		setBugs(undefined);
		void allBugs(statuses).then(setBugs);
	}, [statuses]);

	const toggle = (s: BugStatus) => setStatuses(statuses.includes(s)
		? statuses.filter(x => x !== s)
		: [...statuses, s]);

	return <main className='page-contents bugs'>
		<div className='bugs__filters'>
			{BUG_STATUS.map(s => <label key={s} className='bugs__filter'>
				<input type='checkbox' checked={statuses.includes(s)} onChange={() => toggle(s)} />
				<BugStatusPill status={s} />
			</label>)}
		</div>
		{!bugs && <p className='bugs__muted'>Loading…</p>}
		{bugs && !bugs.length && <p className='bugs__muted'>No reports.</p>}
		{bugs && <BugList bugs={bugs} team />}
	</main>;
}
