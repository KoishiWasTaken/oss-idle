import {
	posY,
	type Field,
	type Layer,
} from './frame';

/** the timing barlines scrolling down the playfield */
export const drawBarlines: Layer<Field> = (f) => {
	const { ctx, game, vp, g } = f;
	ctx.strokeStyle = 'rgba(255,255,255,0.16)';
	const barlines = game.barlines;
	for (let i = 0; i < barlines.length; i++) {
		const bl = barlines[i];
		const y = posY(f, bl.pos);
		if (y < -2 || y > vp.h + 2) continue;
		ctx.beginPath();
		ctx.moveTo(g.x0, y);
		ctx.lineTo(g.x0 + g.fieldWidth, y);
		ctx.stroke();
	}
};
