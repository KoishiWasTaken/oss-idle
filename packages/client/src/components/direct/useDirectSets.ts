import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { INTRO_SET_ID } from '@oss-idle/shared/beatmap';
import BeatmapAPI, { type Metadata } from '../../osu/beatmap/beatmap_api';
import BeatmapStore, { beatmapsVersion } from '../../osu/beatmap/beatmap_store';
import { rpc } from '../../online/client';
import {
	directDisplay,
	type DirectDisplay,
} from './directState';

/** The catalog's sets the display lists: ranked ones, loved ones, or both. */
const catalogSets = async (display: DirectDisplay) =>
	(await BeatmapAPI.getManifest()).beatmaps.filter(s => s.id !== INTRO_SET_ID
		&& (display === 'all' || s.loved === (display === 'loved')));

const unrankedSets = async (): Promise<Metadata[]> =>
	(await rpc.v1.beatmap.unranked.$get()).json();

/** Every set the Display filter lists, and which of them are downloaded. */
export default function useDirectSets() {
	const [library] = useSynced(beatmapsVersion);
	const [display] = useSynced(directDisplay);
	return useAsync(async () => {
		const lists = await Promise.all([
			display !== 'unranked' ? catalogSets(display) : [],
			display === 'unranked' || display === 'all' ? unrankedSets() : [],
		]);
		const sets = lists.flat();
		const stored = await Promise.all(sets.map(s => BeatmapStore.has(s.id)));
		return {
			sets,
			downloaded: new Set(sets.filter((_, i) => stored[i]).map(s => s.id)),
		};
	}, [library, display]);
}
