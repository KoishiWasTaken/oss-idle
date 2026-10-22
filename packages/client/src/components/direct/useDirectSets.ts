import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { INTRO_SET_ID } from '@oss-idle/shared/beatmap';
import BeatmapAPI from '../../osu/beatmap/beatmap_api';
import BeatmapStore, { beatmapsVersion } from '../../osu/beatmap/beatmap_store';

/** Every set the catalog lists, and which of them are downloaded. */
export default function useDirectSets() {
	const [library] = useSynced(beatmapsVersion);
	return useAsync(async () => {
		const manifest = await BeatmapAPI.getManifest();
		const sets = manifest.beatmaps.filter(s => s.id !== INTRO_SET_ID);
		const stored = await Promise.all(sets.map(s => BeatmapStore.has(s.id)));
		return {
			sets,
			downloaded: new Set(sets.filter((_, i) => stored[i]).map(s => s.id)),
		};
	}, [library]);
}
