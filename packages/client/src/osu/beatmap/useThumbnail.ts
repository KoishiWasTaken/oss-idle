import {
	useEffect,
	useReducer,
} from 'react';

import BeatmapStore from './beatmap_store';
import type LightBeatmap from './LightBeatmap';

/** The beatmap's card cover, at once when it was shown lately. */
export default function useThumbnail(beatmap: LightBeatmap, shown: boolean): string | undefined {
	const thumb = shown ? BeatmapStore.getBeatmapThumbnail(beatmap) : undefined;
	const [, ready] = useReducer((n: number) => n + 1, 0);
	useEffect(() => {
		let live = true;
		if (thumb && !thumb.url) void thumb.ready.then(() => { if (live) ready(); });
		return () => { live = false; };
	}, [thumb]);
	return thumb?.url;
}
