import { type Grade } from '@oss-idle/shared/grade';
import type { ManiaGame } from '@oss-idle/shared/rulesets/mania/maniaGame';

import type Skin from '../../osu/skin/Skin';

export type Viewport = {
	w: number,
	h: number,
	/** approach span in scroll units (ms a note is visible) - lower = faster scroll */
	scrollMs: number,
};

/** screen geometry derived from the viewport, the key count and the skin sizes */
export type PlayfieldGeometry = {
	keys: number,
	fieldWidth: number,
	/** y of the receptor / judgement line */
	lineY: number,
	pxPerUnit: number,
	/** left edge of the playfield */
	x0: number,
	/** right edge of the playfield and its HP bar */
	right: number,
	/** where the grade badge goes: left of the score, as tall as it (filled in as it draws) */
	grade: { right: number, top: number, height: number },
};

export type StrainHud = {
	/** what the gauges read: the live strain, by skill */
	source: { strainsAt(now: number): Readonly<Record<string, number>> },
	/** the gauges, top to bottom */
	gauges: readonly { skill: string, label: string }[],
	/** where the gauges start, past anything drawn at the left edge */
	left?: number,
	/** where on the warm-up bar, 0 cold to 1 exhausted */
	warmupBar?: number,
	warmupLabel?: string,
	/** Cold, Warming up, Peak, Pushing, Fatigued */
	warmupState?: string,
	/** which way the map moves the bar, -3 cooling to 3 warming */
	warmupTrend?: number,
};

export type DrawOptions = {
	debug?: boolean,
	/** stacks the top-right accuracy/score lower (narrow screens) */
	mobile?: boolean,
	/** draws the per-skill strain gauges when set */
	strain?: StrainHud,
	/** the ruleset's debug readouts over the playfield */
	debugStats?: (game: ManiaGame, now: number) => string[],
	/** fired only when the live grade changes (drive a DOM grade badge from it) */
	onGrade?: (grade: Grade) => void,
};

/** What the field layers draw: a game's, or a chart's in the editor's preview. */
export type Field = Pick<
	ManiaGame, 'keyCount' | 'notes' | 'scroll' | 'barlines' | 'columnFlash' | 'visibleNotesAt'
>;

/** A page canvas's 2D context, or a worker's (the editor draws its playfield in one). */
export type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** everything a layer needs to paint one frame */
export type Frame<G extends Field = ManiaGame> = {
	/** the game's page canvas, or a worker's for the field layers */
	ctx: G extends ManiaGame ? CanvasRenderingContext2D : Context2D,
	game: G,
	/** the skin, for the game's HUD: the stage layers draw from their layout's assets */
	skin: G extends ManiaGame ? Skin : unknown,
	/** song time in ms */
	now: number,
	/** the scroll position at `now` */
	nowPos: number,
	vp: Viewport,
	g: PlayfieldGeometry,
	opts: DrawOptions,
};

export const playfieldGeometry = (
	game: Field,
	skin: Skin,
	vp: Viewport,
): PlayfieldGeometry => {
	const keys = game.keyCount;
	const fieldWidth = keys * skin.data.playfield.columnWidth;
	const lineY = vp.h - skin.data.playfield.hitPosition;
	const x0 = (vp.w - fieldWidth) / 2;
	return {
		keys,
		fieldWidth,
		lineY,
		pxPerUnit: lineY / vp.scrollMs,
		x0,
		right: x0 + fieldWidth,
		grade: {
			right: 160, top: 16, height: 40,
		},
	};
};

/** y of a note at song time `time`, given the current `now`. */
export const noteY = (f: Frame<Field>, time: number): number =>
	posY(f, f.game.scroll.positionAt(time));

/** y of scroll position `pos` (a note's or bar line's, worked out once). */
export const posY = (f: Frame<Field>, pos: number): number =>
	f.g.lineY - (pos - f.nowPos) * f.g.pxPerUnit;

export const roundRect = (
	ctx: Context2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) => {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
};
