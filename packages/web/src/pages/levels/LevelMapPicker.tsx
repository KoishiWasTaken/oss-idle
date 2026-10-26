import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLingui } from '@lingui/react/macro';
import {
	useEffect,
	useState,
} from 'react';

import {
	addLevelMap,
	type LevelMapHit,
	searchLevelMaps,
} from '../../api/levelVotes';
import LevelMapPickerHit from './LevelMapPickerHit';

const DEBOUNCE_MS = 250;

/** Admin: find a live difficulty by its set's title, artist or mapper and list it. */
export default function LevelMapPicker({ onAdded }: { onAdded: () => Promise<void> | void }) {
	const { t } = useLingui();
	const [text, setText] = useState('');
	const [hits, setHits] = useState<LevelMapHit[]>([]);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string>();

	useEffect(() => {
		const query = text.trim();
		if (query.length < 2) { setHits([]); return; }
		let live = true;
		setSearching(true);
		const timer = setTimeout(() => {
			searchLevelMaps(query)
				.then(rows => { if (live) setHits(rows); })
				.catch(() => { if (live) setHits([]); })
				.finally(() => { if (live) setSearching(false); });
		}, DEBOUNCE_MS);
		return () => {
			live = false;
			clearTimeout(timer);
		};
	}, [text]);

	const add = async (beatmapId: number) => {
		try {
			await addLevelMap(beatmapId);
			setText('');
			setError(undefined);
			await onAdded();
		} catch (e) {
			setError((e as Error).message);
		}
	};

	return (<div className='level-picker'>
		<div className='level-picker__row'>
			<FontAwesomeIcon icon={faMagnifyingGlass} />
			<input
				value={text}
				placeholder={t`Add a map: search a title, artist, mapper or difficulty`}
				onChange={e => setText(e.target.value)}
				onKeyDown={e => { if (e.key === 'Escape') setText(''); }}
			/>
		</div>
		{error && <p className='level-votes__error'>{error}</p>}
		{!!hits.length && <div className={`level-picker__hits ${searching ? 'is-loading' : ''}`}>
			{hits.map(hit => <LevelMapPickerHit
				key={hit.beatmapId}
				hit={hit}
				onPick={() => void add(hit.beatmapId)}
			/>)}
		</div>}
		{!hits.length && !searching && text.trim().length >= 2 && <div className='level-picker__hits'>
			<p className='level-picker__empty'>{t`No live difficulty matches.`}</p>
		</div>}
	</div>);
}
