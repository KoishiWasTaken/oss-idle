import {
	useEffect,
	useState,
} from 'react';

import MainMenu from '../scenes/MainMenu';
import { warmedUp } from './menuWarmed';

/** The longest the boot waits on the GPU before giving the screen to the intro. */
const MAX_MS = 3000;
/** A frame this soon after the last one means the GPU kept up. */
const STEADY_GAP_MS = 40;

const frame = () => new Promise<number>(resolve => requestAnimationFrame(resolve));

/** Resolves once frames have come steadily for a few in a row (or MAX_MS passed). */
const settled = async () => {
	const until = performance.now() + MAX_MS;
	let last = await frame();
	let steady = 0;
	while (steady < 4 && performance.now() < until) {
		const now = await frame();
		steady = now - last < STEADY_GAP_MS ? steady + 1 : 0;
		last = now;
	}
};

/**
 * The GPU compiles a shader program the first time it draws something new - a blur, a
 * gradient fading out, an image scaled down - and the screen waits for it: a new
 * player's first trip into the menu froze for a second. So at boot the real menu is
 * drawn once, nearly invisible and untouchable, until the GPU keeps up again; then it
 * goes, and the intro starts. Later launches find the programs in Chromium's cache.
 */
export default function MenuWarmup() {
	const [done, setDone] = useState(false);

	useEffect(() => {
		let gone = false;
		void settled().then(() => {
			if (gone) return;
			setDone(true);
			warmedUp();
		});
		return () => { gone = true; };
	}, []);

	if (done) return null;
	return (
		<div aria-hidden style={{
			position: 'fixed', inset: 0, opacity: 0.01, pointerEvents: 'none', zIndex: 'var(--z-warmup)',
		}}>
			<MainMenu flash />
		</div>
	);
}
