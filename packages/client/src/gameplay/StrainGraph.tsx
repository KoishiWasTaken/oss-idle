import {
	useEffect,
	useRef,
} from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';
import type { HitRecord } from '@oss-idle/shared/rulesets/mania/maniaGame';
import { HitWindows } from '@oss-idle/shared/rulesets/mania/scoring';

import { currentSkin } from '../osu/skin/Skin';
import { sizeCanvas } from '../sizeCanvas';
import { drawDevianceGraph } from './hitError';

interface Props {
	hits: HitRecord[]
	windows: HitWindows
	songEndMs: number
	failMs?: number
	overlay?: { time: number, value: number }[]
	width?: number
	height?: number
}

/** A standalone deviance graph for an arbitrary set of hit records. */
export default function StrainGraph({ 
	hits, 
	windows, 
	songEndMs, 
	failMs, 
	overlay,
	width = 320, 
	height = 130, 
}: Props) {
	const [skin] = useSynced(currentSkin);
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = ref.current!;
		const ctx = canvas.getContext('2d')!;
		sizeCanvas(canvas, ctx, width, height);
		drawDevianceGraph(skin, ctx, {
			hits, 
			windows,
			songEndMs, 
			failMs,
			overlay, 
			width, 
			height, 
		});
	}, [hits, windows, songEndMs, failMs, overlay, width, height]);
	return <canvas ref={ref} className="strain__canvas" />;
}
