import {
	useEffect,
	useRef,
} from 'react';
import { drawWarmupGauge } from '../gameplay/render/hud';
import type { Frame } from '../gameplay/render/frame';

const STATES: [string, number][] = [
	['Cold', 0.05],
	['Warming up', 0.3],
	['Peak', 0.5],
	['Pushing', 0.7],
	['Fatigued', 0.9],
];

/** The gameplay HUD's warm-up bar in each of its zones, on a dark field. */
export default function WarmupGaugePreview() {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const ctx = ref.current!.getContext('2d')!;
		// the gauge reads only the canvas and the viewport width off the frame
		const f = {
			ctx, vp: {
				w: 1000, h: 0, scrollMs: 0, 
			},
		} as Frame;
		let raf = 0;
		const draw = () => {
			ctx.setTransform(2, 0, 0, 2, 0, 0);
			ctx.fillStyle = '#111';
			ctx.fillRect(0, 0, 300, 30 + STATES.length * 40);
			ctx.font = '600 11px "Exo 2", sans-serif';
			STATES.forEach(([state, v], i) =>
				drawWarmupGauge(f, 'Warm-up', state, v, 30, 30 + i * 40));
			raf = requestAnimationFrame(draw);
		};
		draw();
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<canvas ref={ref} width={600} height={60 + STATES.length * 80}>
			{STATES.map(([label]) => label).join(', ')}
		</canvas>
	);
}
