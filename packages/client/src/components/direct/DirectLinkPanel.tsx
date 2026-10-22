import { useLingui } from '@lingui/react/macro';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import BeatmapAPI from '../../osu/beatmap/beatmap_api';
import BeatmapStore, { beatmapsVersion } from '../../osu/beatmap/beatmap_store';
import DirectPanel from './DirectPanel';
import {
	directDownloads,
	directLink,
	downloadLabel,
	downloadSet,
	goToMap,
	openMapPage,
} from './directState';
import './direct.css';

/** oss!direct panel for a map link: the set on the right, over any scene. */
export default function DirectLinkPanel() {
	const { t } = useLingui();
	const [setId] = useSynced(directLink);
	const [library] = useSynced(beatmapsVersion);
	const [downloads] = useSynced(directDownloads);
	const found = useAsync(async () => {
		if (setId === undefined) return;
		const set = (await BeatmapAPI.getManifest()).beatmaps.find(s => s.id === setId);
		return set && {
			set, downloaded: await BeatmapStore.has(set.id),
		};
	}, [setId, library]);

	if (setId === undefined || found?.set.id !== setId) return null;
	const { set, downloaded } = found;
	const progress = downloads[set.id];
	const close = () => directLink.set(undefined);

	return (
		<div className='direct-link'>
			<div className='direct-link__title'>
				<span className='direct-tab__oss'>oss!</span>direct
			</div>
			<DirectPanel set={set} />
			<div className='direct-link__actions'>
				<button
					className='direct-link__btn'
					style={{ '--accent': '#4f9fd8' } as React.CSSProperties}
					disabled={!downloaded}
					onClick={() => void goToMap(set)}
				>
					{t`Go to map`}
				</button>
				<button
					className='direct-link__btn'
					style={{ '--accent': '#ff4089' } as React.CSSProperties}
					disabled={downloaded || progress !== undefined}
					onClick={() => void downloadSet(set)}
				>
					{downloadLabel(downloaded, progress)}
				</button>
				<button
					className='direct-link__btn'
					style={{ '--accent': '#e93100' } as React.CSSProperties}
					onClick={() => openMapPage(set.id)}
				>
					{t`View listing`}
				</button>
				<button
					className='direct-link__btn'
					style={{ '--accent': '#6b6b6b' } as React.CSSProperties}
					onClick={close}
				>
					{t`Close`}
				</button>
			</div>
		</div>
	);
}
