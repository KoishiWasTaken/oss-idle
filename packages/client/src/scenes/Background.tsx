import './Background.css';

import { useParallax } from '@oss-idle/shared/hooks/useParallax';
import useSynced from '@oss-idle/shared/hooks/useSynced';

import { music } from '../audio/MusicPlayer';
import { SETTINGS } from '../db/settings';
import LightBeatmap from '../osu/beatmap/LightBeatmap';
import useFileUrl from '../osu/beatmap/useFileUrl';

/** The live track's backdrop, or a given map's - a screen about one particular
 *  map (a result) says which, instead of following whatever is selected. An
 *  `image` replaces both. */
export default function Background({ beatmap, image }: { beatmap?: LightBeatmap; image?: string }) {
	const [parallaxOn] = useSynced(SETTINGS.parallax);
	const parallax = useParallax(0.08, parallaxOn);
	
	const [live] = useSynced(music.beatmap);
	const map = beatmap ?? live;
	const stored = useFileUrl(async () => image ? undefined : map?.getBackgroundUri(), [image, map]);
	const background = image ?? stored;

	return (
		<div
			className="background__image"
			style={{
				backgroundImage: background ? `url("${background}")` : '',
				transform: `scale(1.1) translate(${parallax.x * 26}px, ${parallax.y * 26}px)`,
			}}
		/>
	);
};