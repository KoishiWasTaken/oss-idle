import {
	playfieldGeometry,
	type Context2D,
	type Field,
	type Frame,
	type Layer,
	type SkinData,
} from '../gameplay/render/frame';
import { drawPlayfield } from '../gameplay/render/playfield';
import { drawBarlines } from '../gameplay/render/barlines';
import { drawNotes } from '../gameplay/render/notes';
import { drawReceptors } from '../gameplay/render/receptors';
import ChartField from './chartField';
import type { PaintState } from './painter';

const LAYERS: Layer<Field>[] = [drawPlayfield, drawBarlines, drawNotes, drawReceptors];

/**
 * The chart as it plays, beside the editor: the game's own playfield layers and
 * scroll model (scroll speed changes included) at the editor's time, rebuilt with
 * each edit.
 */
export default class EditorPreview {

	private field?: ChartField;
	private builtFrom?: object;

	constructor(private readonly state: PaintState) {}

	/** The field for the chart as it stands. */
	private current(): ChartField {
		if (!this.field || this.state.doc !== this.builtFrom) {
			this.builtFrom = this.state.doc;
			this.field = new ChartField(this.state.chart, this.state.doc, this.field);
		}
		return this.field;
	}

	/** The last frame drawn, filled in again for the next: drawing allocates nothing. */
	private frame?: Frame<Field>;

	private frameFor(
		ctx: Context2D, game: ChartField, skin: SkinData, h: number, scrollMs: number,
	) {
		const w = game.keyCount * skin.data.playfield.columnWidth;
		const last = this.frame;
		if (last?.ctx === ctx && last.game.keyCount === game.keyCount && last.skin === skin
			&& last.vp.w === w && last.vp.h === h && last.vp.scrollMs === scrollMs) {
			last.game = game;
			return last;
		}
		const vp = {
			w, h, scrollMs, 
		};
		return this.frame = {
			ctx, game, skin, now: 0, nowPos: 0, vp, g: playfieldGeometry(game, skin, vp), opts: {},
		};
	}

	/** Draw the field from `left`, at song time `now`. */
	public draw(ctx: Context2D, skin: SkinData, left: number, h: number, now: number) {
		const game = this.current();
		// the skin colours a fixed set of columns; other key counts have nothing to draw with
		if (!skin.data.hitObjects[game.keyCount - 1]) return;
		const frame = this.frameFor(ctx, game, skin, h, this.state.scrollMs);
		frame.now = now;
		frame.nowPos = game.scroll.positionAt(frame.now);
		game.seek(frame.now);
		ctx.save();
		ctx.translate(left, 0);
		if (skin.data.playfield.upscroll) {
			ctx.translate(0, h);
			ctx.scale(1, -1);
		}
		for (const layer of LAYERS) layer(frame);
		ctx.restore();
	}

}
