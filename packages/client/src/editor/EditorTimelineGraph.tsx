import {
	useEffect,
	useRef,
} from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import type EditorSession from './session';
import {
	densityOf,
	straysOf,
	volumeOf,
} from './timelineGraph';

/** The playfield lanes' colours: timing points red, scroll speed points green. */
const MARK_COLORS = {
	timing: '#ff4d6a', scroll: '#78dc78', 
};

/** A tick up from the bottom where each point is, the longer the further it strays from the
 *  map's baseline. */
const drawTicks = (
	ctx: CanvasRenderingContext2D,
	strays: Float32Array,
	h: number,
	color: string,
) => {
	ctx.globalAlpha = 0.4;
	ctx.fillStyle = color;
	for (let x = 0; x < strays.length; x++) {
		if (strays[x] < 0) continue;
		const tick = Math.max(2, Math.round(h * (0.12 + 0.48 * strays[x])));
		ctx.fillRect(x, h - tick, 1, tick);
	}
	ctx.globalAlpha = 1;
};

/** Behind the time track: the song's volume, and how dense the notes are, along the map. */
export default function EditorTimelineGraph({ session, marks }: {
	session: EditorSession,
	/** points to mark along it */
	marks?: 'timing' | 'scroll',
}) {
	const ref = useRef<HTMLCanvasElement>(null);
	/** the volume, read off the whole song: made again when the song, length or width change */
	const loudness = useRef<{
		song?: object, length: number, w: number, volume: Float32Array,
	}>(undefined);
	useSynced(session.revision);
	const [hovered] = useSynced(session.hoveredPoint);
	const {
		notes, length, song, timing, scroll,
	} = session;

	useEffect(() => {
		const canvas = ref.current!;
		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
			const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext('2d')!;
			const kept = loudness.current;
			if (!kept || kept.song !== song || kept.length !== length || kept.w !== w) {
				loudness.current = {
					song, length, w, volume: volumeOf(song, length, w),
				};
			}
			const { volume } = loudness.current!;
			ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
			ctx.beginPath();
			ctx.moveTo(0, h);
			for (let x = 0; x < w; x++) ctx.lineTo(x, h - volume[x] * h);
			ctx.lineTo(w, h);
			ctx.fill();
			const density = densityOf(notes, length, w);
			ctx.strokeStyle = 'rgba(255, 102, 170, 0.9)';
			ctx.lineWidth = dpr;
			ctx.beginPath();
			for (let x = 0; x < w; x++) ctx.lineTo(x, h - density[x] * (h - dpr) - dpr / 2);
			ctx.stroke();
			if (marks) {
				const points = marks === 'timing' ? timing : scroll;
				drawTicks(ctx, straysOf(points, marks, length, w), h, MARK_COLORS[marks]);
			}
		};
		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [notes, length, song, marks, timing, scroll]);

	return (
		<>
			<canvas ref={ref} className="editor__timeline-graph" />
			{hovered && length > 0 && (
				<span
					className={`editor__hovered-point ${hovered.sv ? 'is-sv' : ''}`}
					style={{ left: `${hovered.time / length * 100}%` }}
				/>
			)}
		</>
	);
}
