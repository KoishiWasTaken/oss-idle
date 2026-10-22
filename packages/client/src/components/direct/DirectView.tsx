import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import type { Metadata } from '../../osu/beatmap/beatmap_api';
import LightBeatmapSet from '../../osu/beatmap/LightBeatmapSet';
import { matchesSearch } from '../../osu/beatmap/beatmapSearch';
import PageBarActions from '../page/PageBarActions';
import DirectFilters from './DirectFilters';
import DirectRow from './DirectRow';
import DirectPanel from './DirectPanel';
import useDirectSets from './useDirectSets';
import {
	directDownloads,
	directSearch,
	directSelected,
	downloadLabel,
	downloadSet,
	goToMap,
	openMapPage,
	preview,
	showDownloaded,
} from './directState';

export type DirectSort = 'new' | 'played';

const ORDER: Record<DirectSort, (a: Metadata, b: Metadata) => number> = {
	new: (a, b) => b.rankedAt.localeCompare(a.rankedAt),
	played: (a, b) => b.plays - a.plays,
};

/** oss!direct's list in one order, beside the picked set's panel. */
export default function DirectView({ sort }: { sort: DirectSort }) {
	const { t } = useLingui();
	const data = useDirectSets();
	const [search] = useSynced(directSearch);
	const [withDownloaded] = useSynced(showDownloaded);
	const [selectedId] = useSynced(directSelected);
	const [downloads] = useSynced(directDownloads);

	const lights = useMemo(
		() => new Map(data?.sets.map(s => [s.id, LightBeatmapSet.fromMetadata(s)])),
		[data],
	);

	const shown = useMemo(() => {
		if (!data) return [];
		return data.sets
			.filter(s => withDownloaded || !data.downloaded.has(s.id))
			.filter(s => {
				const light = lights.get(s.id);
				return !search.trim() || !!light?.beatmaps
					.some((b, i) => matchesSearch(b, light, search, s.versions[i]?.tags));
			})
			.sort(ORDER[sort]);
	}, [data, lights, search, withDownloaded, sort]);

	const selected = data?.sets.find(s => s.id === selectedId);
	const progress = selected && downloads[selected.id];
	const downloaded = !!selected && !!data?.downloaded.has(selected.id);

	const select = (set: Metadata) => {
		void directSelected.set(set.id);
		preview(set);
	};

	return (
		<div className='direct'>
			<div className='direct__main'>
				<DirectFilters matches={shown.length} />
				<div className='direct__list'>
					{shown.map(set => (
						<DirectRow
							key={set.id}
							set={set}
							selected={set.id === selectedId}
							downloaded={data?.downloaded.has(set.id) ?? false}
							progress={downloads[set.id]}
							onSelect={() => select(set)}
							onDownload={() => void downloadSet(set)}
						/>
					))}
				</div>
			</div>
			<DirectPanel set={selected} />
			<PageBarActions actions={[
				{
					id: 'download',
					label: downloadLabel(downloaded, progress),
					disabled: !selected || downloaded || progress !== undefined,
					onClick: () => selected && void downloadSet(selected),
					order: 1,
				},
				{
					id: 'go',
					label: t`Go to map`,
					disabled: !downloaded,
					onClick: () => selected && void goToMap(selected),
					order: 2,
				},
				{
					id: 'listing',
					label: t`View listing`,
					disabled: !selected,
					onClick: () => selected && openMapPage(selected.id),
					order: 3,
				},
			]} />
		</div>
	);
}
