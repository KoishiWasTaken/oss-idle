/**
 * Sizes a 2D canvas to `w`×`h` CSS pixels at the device pixel ratio (capped at
 * 2 to bound the fill cost) and scales its context so drawing is in CSS pixels.
 * Pass `setCss: false` when the stylesheet sizes the canvas. Returns the ratio.
 */
export const sizeCanvas = (
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	setCss = true,
): number => {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	canvas.width = w * dpr;
	canvas.height = h * dpr;
	if (setCss) {
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
	}
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	return dpr;
};
