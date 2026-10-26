import './AdminList.css';

import {
	type ReactNode,
	useEffect,
	useMemo,
	useState,
} from 'react';

import { useAction } from '@oss-idle/shared/hooks/useAction';

type SortKey = 'status' | 'submitted' | 'published';
type Act = (change: () => Promise<unknown>) => Promise<void>;
type Row<S extends string> = {
	id: number; status: S; updatedAt: string | null; publishedAt: string | null;
};

const time = (iso: string | null): number => iso ? new Date(iso).getTime() : 0;

/** A sortable moderation queue: `act` runs a change, then reloads the list. */
export default function AdminList<S extends string, T extends Row<S>>({
	load, statusOrder, noun, renderRow,
}: {
	load: () => Promise<T[]>;
	statusOrder: Record<S, number>;
	noun: string;
	renderRow: (row: T, busy: boolean, act: Act) => ReactNode;
}) {
	const [list, setList] = useState<T[]>();
	const [authorized, setAuthorized] = useState<boolean>();
	const {
		busy, error, setError, run,
	} = useAction();
	const [sort, setSort] = useState<SortKey>('status');
	const [asc, setAsc] = useState(true);

	const refresh = () =>
		load()
			.then(rows => { setList(rows); setAuthorized(true); })
			.catch(e => { setAuthorized(false); setError(String(e.message ?? e)); });

	useEffect(() => { void refresh(); }, []);

	const act = (change: () => Promise<unknown>) => run(change, refresh);

	const sorted = useMemo(() => {
		const dir = asc ? 1 : -1;
		const key = (r: T) => sort === 'status' ? statusOrder[r.status]
			: sort === 'published' ? time(r.publishedAt) : time(r.updatedAt);
		return [...(list ?? [])].sort((a, b) => (key(a) - key(b)) * dir);
	}, [list, sort, asc]);

	const toggleSort = (key: SortKey) => {
		if (sort === key) setAsc(a => !a);
		else { setSort(key); setAsc(false); }
	};
	const caret = (key: SortKey) => sort === key ? (asc ? ' ▲' : ' ▼') : '';
	const sortBtn = (key: SortKey, label: string) => (
		<button
			className={`admin-list__sort-btn ${sort === key ? 'current' : ''}`}
			onClick={() => toggleSort(key)}
		>
			{label}{caret(key)}
		</button>
	);

	if (authorized === false) return <main className='admin-list'>
		<p className='admin-list__error'>{error ?? 'Admins only.'}</p>
	</main>;
	if (!list) return <main className='admin-list'>
		<p className='admin-list__muted'>Loading…</p>
	</main>;

	return (
		<main className='admin-list'>
			<div className='admin-list__toolbar'>
				<div className='admin-list__sort'>
					<span className='admin-list__muted'>Sort by</span>
					{sortBtn('status', 'Status')}
					{sortBtn('submitted', 'Submitted')}
					{sortBtn('published', 'Published')}
				</div>
				<span className='admin-list__count'>{sorted.length} {noun}</span>
			</div>

			{error && <p className='admin-list__error'>{error}</p>}

			<div className='admin-list__list'>
				{sorted.map(row => renderRow(row, busy, act))}
			</div>
		</main>
	);
}
