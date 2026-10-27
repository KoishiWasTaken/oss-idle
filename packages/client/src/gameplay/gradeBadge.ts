import type { PlayfieldGeometry } from './render/frame';

/** Keeps the DOM grade badge left of the score the canvas draws, where the skin's font puts
 *  it. Writes the style only when it moves: this runs every frame. */
export const makeGradePlacer = () => {
	let right = -1;
	let top = -1;
	let height = -1;
	return (el: HTMLElement | null, g: PlayfieldGeometry) => {
		if (!el) return;
		const r = Math.round(g.grade.right);
		const t = Math.round(g.grade.top);
		const h = Math.round(g.grade.height);
		if (r === right && t === top && h === height) return;
		right = r;
		top = t;
		height = h;
		el.style.right = `${r}px`;
		el.style.top = `${t}px`;
		el.style.height = `${h}px`;
	};
};

/** Keeps the warm-up bar's DOM hover area over the bar the canvas draws. */
export const makeWarmupPlacer = () => {
	let left = -1;
	let top = -1;
	let width = -1;
	return (el: HTMLElement | null, g: PlayfieldGeometry) => {
		if (!el) return;
		const l = Math.round(g.warmup.left);
		const t = Math.round(g.warmup.top);
		const w = Math.round(g.warmup.width);
		if (l === left && t === top && w === width) return;
		left = l;
		top = t;
		width = w;
		el.style.left = `${l}px`;
		el.style.top = `${t}px`;
		el.style.width = `${w}px`;
		el.style.display = w ? '' : 'none';
	};
};

/** Keeps the DOM mods row under the accuracy the canvas draws, at the HUD's scale. */
export const makeModsPlacer = () => {
	let right = -1;
	let top = -1;
	let scale = -1;
	return (el: HTMLElement | null, g: PlayfieldGeometry) => {
		if (!el) return;
		const r = Math.round(g.mods.right);
		const t = Math.round(g.mods.top);
		if (r === right && t === top && g.mods.scale === scale) return;
		right = r;
		top = t;
		scale = g.mods.scale;
		el.style.right = `${r}px`;
		el.style.top = `${t}px`;
		el.style.transform = `scale(${scale})`;
	};
};
