import './RankedMaps.css';
import '../search/Search.css';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import Link from '../../components/Link';
import MapsetCard from '../../components/MapsetCard';
import MapsNav from './MapsNav';
import {
	type MapFilter,
	type getAllMaps,
	type getPopularMaps,
} from '../../api/maps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCaretDown,
	faCaretUp,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';

export type MapSort = 'date' | 'plays';
export type MapDir = 'asc' | 'desc';
export type MapStatus = NonNullable<MapFilter['status']>;

type Mapsets =
	| Awaited<ReturnType<typeof getAllMaps>>
	| Awaited<ReturnType<typeof getPopularMaps>>;

type Props = {
	sort: MapSort,
	dir: MapDir,
	status: MapStatus,
	q: string,
	mapsets: Mapsets,
};

/** The beatmap listing: a name to look for, which maps, and their order. */
export default function RankedMaps({ sort, dir, status, q, mapsets }: Props) {
	const { t } = useLingui();
	const navigate = useNavigate();
	const [text, setText] = useState(q);

	const sortLabel: Record<MapSort, string> = {
		date: status === 'ranked' ? t`Ranked` : t`Date`, plays: t`Plays`,
	};
	const statusLabel: Record<MapStatus, string> = {
		any: t`Any`, ranked: t`Ranked`, unranked: t`Unranked`,
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
							void navigate({
								to: '/maps', search: {
									sort, dir, status, q: e.target.value, 
								}, replace: true,
							});
						}}
					/>
				</label>
			</div>
			<div className='list__beatmap_sort'>
				<span><Trans>Categories</Trans></span>
				{(['any', 'ranked', 'unranked'] as const).map(type => (
					<Link
						key={type}
						className={type === status ? 'current' : ''}
						to='/maps'
						search={{
							sort, dir, status: type, q, 
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
							sort: type, dir: nextDir, status, q,
						}}
					>
						{sortLabel[type]}
						<FontAwesomeIcon icon={dir === 'asc' ? faCaretUp : faCaretDown} />
					</Link>);
				})}
			</div>
			<div className="page-contents">
				<div className='list__beatmap-container'>
					{mapsets.map(mapset => <MapsetCard key={mapset.id} mapset={mapset} />)}
				</div>
			</div>
		</main>
	);
}
