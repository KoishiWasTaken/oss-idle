import {
	useEffect,
	useRef,
} from 'react';
import type { ManiaGame } from '@oss-idle/shared/sim/maniaGame';
import { drawDevianceGraph } from './hitError';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { currentSkin } from '../osu/skin/Skin';
import { sizeCanvas } from '../sizeCanvas';

/**
 * Result-screen canvas plotting hit deviation over the course of the song.
 * Width is responsive (fills its container); height is fixed by the prop.
 */
export default function DevianceGraph({ 
	game, 
	height = 190,
}: { 
	game: ManiaGame, 
	height?: number 
}) {
	const [skin] = useSynced(currentSkin);
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = ref.current!;
		const ctx = canvas.getContext('2d')!;
		const draw = () => {
			const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 300;
			sizeCanvas(canvas, ctx, width, height, false);
			canvas.style.height = `${height}px`;
			drawDevianceGraph(skin, ctx, {
				hits: game.hits,
				windows: game.windows,
				songEndMs: game.songEndMs,
				width,
				height,
			});
		};
		draw();
		const ro = new ResizeObserver(draw);
		ro.observe(canvas);
		return () => ro.disconnect();
	}, [game, height]);

	return <canvas ref={ref} className="play__graph" />;
}
