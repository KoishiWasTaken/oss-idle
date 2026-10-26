import './RankedMaps.css';
import '../search/Search.css';

import {
	faCaretDown,
	faCaretUp,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useNavigate } from '@tanstack/react-router';
import {
	useEffect,
	useRef,
	useState,
} from 'react';

import { PAGE_SIZE } from '@oss-idle/shared/rankings';
import { rulesetLabel } from '@oss-idle/shared/rulesets/display';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import {
	type getAllMaps,
	type getPopularMaps,
	type MapFilter,
} from '../../api/maps';
import Pager from '../../components/leaderboard/Pager';
import Link from '../../components/Link';
import MapsetCard from '../../components/MapsetCard';
import {
	ENABLED_RULESETS,
	RULESET_TABS,
} from '../../rulesets';
import MapsNav from './MapsNav';

export type MapSort = 'date' | 'plays';
export type MapDir = 'asc' | 'desc';
export type MapStatus = NonNullable<MapFilter['status']>;

type Mapsets =
	| Awaited<ReturnType<typeof getAllMaps>>
	| Awaited<ReturnType<typeof getPopularMaps>>;

type Props = {
	/** the ruleset the listing is in; the server's first when not asked */
	ruleset?: RulesetId,
	sort: MapSort,
	dir: MapDir,
	status: MapStatus,
	q: string,
	page: number,
	mapsets: Mapsets,
};

/** The beatmap listing: a name to look for, which maps, and their order. */
export default function RankedMaps({ ruleset, sort, dir, status, q, page, mapsets }: Props) {
	const { t } = useLingui();
	const navigate = useNavigate();
	const [text, setText] = useState(q);

	// the route write re-runs the loader - a whole-catalog refetch per keystroke
	// otherwise; a typing pause keeps it to one
	const routeTimer = useRef<number | undefined>();
	useEffect(() => () => clearTimeout(routeTimer.current), []);

	const sortLabel: Record<MapSort, string> = {
		date: status === 'ranked' ? t`Ranked` : status === 'loved' ? t`Loved` : t`Date`, plays: t`Plays`,
	};
	const statusLabel: Record<MapStatus, string> = {
		any: t`Any`, ranked: t`Ranked`, loved: t`Loved`, unranked: t`Unranked`,
	};

	return (
		<main>
			<MapsNav current='listing' />
			<div className='list__beatmap_search'>
				<label className='search__box'>
					<FontAwesomeIcon icon={faMagnifyingGlass} />
					<input
						value={text}
						placeholder={t`Search by title, artist or mapper`}
						onChange={e => {
							setText(e.target.value);
							clearTimeout(routeTimer.current);
							routeTimer.current = window.setTimeout(() => {
								void navigate({
									to: '/maps', search: {
										ruleset, sort, dir, status, q: e.target.value, page: 1,
									}, replace: true,
								});
							}, 250);
						}}
					/>
				</label>
			</div>
			{ENABLED_RULESETS.length > 1 && (
				<div className='list__beatmap_sort'>
					<span><Trans>Mode</Trans></span>
					{RULESET_TABS.map(id => (
						<Link
							key={id}
							className={id === (ruleset ?? ENABLED_RULESETS[0]) ? 'current' : ''}
							to='/maps'
							search={{
								ruleset: id, sort, dir, status, q,
							}}
						>
							{rulesetLabel(id)}
						</Link>
					))}
				</div>
			)}
			<div className='list__beatmap_sort'>
				<span><Trans>Categories</Trans></span>
				{(['any', 'ranked', 'loved', 'unranked'] as const).map(type => (
					<Link
						key={type}
						className={type === status ? 'current' : ''}
						to='/maps'
						search={{
							ruleset, sort, dir, status: type, q,
						}}
					>
						{statusLabel[type]}
					</Link>
				))}
			</div>
			<div className='list__beatmap_sort'>
				<span><Trans>Sort by</Trans></span>
				{(['date', 'plays'] as const).map(type => {
					const current = type === sort;
					const nextDir: MapDir = current ? (dir === 'asc' ? 'desc' : 'asc') : dir;
					return (<Link
						key={type}
						className={`${current ? 'current' : ''} ${dir === 'asc' ? 'asc' : 'desc'}`}
						to='/maps'
						search={{
							ruleset, sort: type, dir: nextDir, status, q,
						}}
					>
						{sortLabel[type]}
						<FontAwesomeIcon icon={dir === 'asc' ? faCaretUp : faCaretDown} />
					</Link>);
				})}
			</div>
			<div className="page-contents">
				<div className='list__beatmap-container'>
					{mapsets.map(mapset => <MapsetCard key={mapset.id} mapset={mapset} ruleset={ruleset} />)}
				</div>
				<Pager page={page} hasNext={mapsets.length === PAGE_SIZE} />
			</div>
		</main>
	);
}
