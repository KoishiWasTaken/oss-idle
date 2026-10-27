import type { ManiaGame } from '@oss-idle/shared/rulesets/mania/maniaGame';

import type { ManiaAssets } from '../osu/skin/maniaAssets';
import type Skin from '../osu/skin/Skin';
import { makeComboBurst } from './render/comboBurst';
import {
	type DrawOptions,
	type PlayfieldGeometry,
	playfieldGeometry,
	type Viewport,
} from './render/frame';
import { makeHud } from './render/hud';
import {
	drawKeys,
	drawLighting,
	drawStageBack,
	drawStageBarlines,
	drawStageFront,
	drawWarningArrows,
	type StageFrame,
	type StageLayer,
} from './render/stage';
import { scorebarThickness } from './render/stageHud';
import {
	type StageLayout,
	stageLayout,
} from './render/stageLayout';
import {
	drawStageNotes,
	preparePatterns,
} from './render/stageNotes';

export type {
	Viewport,
	PlayfieldGeometry,
	DrawOptions,
	StrainHud,
} from './render/frame';
export {
	playfieldGeometry,
	roundRect,
} from './render/frame';

const KEYS_OVER: StageLayer[] = [
	drawStageBack, drawStageBarlines, drawWarningArrows, drawStageNotes, drawKeys, drawLighting,
	drawStageFront,
];
const KEYS_UNDER: StageLayer[] = [
	drawStageBack, drawKeys, drawStageBarlines, drawWarningArrows, drawStageNotes, drawLighting,
	drawStageFront,
];

/**
 * Draws a full mania gameplay frame from an osu! skin onto a 2D canvas: the stage layers
 * (render/stage*.ts) back to front, mirrored for an upside-down stage, then the HUD. Used by
 * the live Gameplay scene and the skin preview so the visuals live in one place.
 *
 * The background and dim are DOM layers beneath the transparent canvas (the caller
 * owns them); the grade badge is a DOM element fed via `opts.onGrade`.
 */
export default class GameplayRenderer {

	// carry eased state, so they're instances
	private readonly hud = makeHud();
	private readonly comboBurst = makeComboBurst();

	// the layout and frame are kept and filled in again: drawing allocates nothing
	private layout?: StageLayout;
	private geometry?: PlayfieldGeometry;
	private frame?: StageFrame;
	private next?: Skin;

	constructor(
		private ctx: CanvasRenderingContext2D,
		private game: ManiaGame,
		private skin: Skin,
	) {}

	/** takes over once its assets have decoded; the current skin draws until then */
	setSkin(skin: Skin) {
		this.next = skin;
	}

	/** clear the canvas (background + dim are DOM layers beneath the transparent canvas) */
	clear(vp: Viewport) {
		this.ctx.clearRect(0, 0, vp.w, vp.h);
	}

	private stage(assets: ManiaAssets, vp: Viewport): StageFrame {
		let L = this.layout;
		if (!L || L.assets !== assets || L.w !== vp.w || L.h !== vp.h) {
			if (L?.assets !== assets) preparePatterns(this.ctx, assets);
			L = this.layout = stageLayout(assets, vp.w, vp.h);
			this.geometry = undefined;
		}
		let g = this.geometry;
		if (!g || g.pxPerUnit !== L.lineY / vp.scrollMs) {
			g = this.geometry = {
				keys: L.keys,
				fieldWidth: L.width,
				lineY: L.lineY,
				pxPerUnit: L.lineY / vp.scrollMs,
				x0: L.x0,
				right: L.x0 + L.width + scorebarThickness({ L }),
				grade: {
					right: 0, top: 0, height: 0,
				},
				mods: {
					right: 0, top: 0, scale: 0,
				},
				warmup: {
					left: 0, top: 0, width: 0,
				},
			};
		}
		const f = this.frame ??= {
			ctx: this.ctx, game: this.game, skin: this.skin, now: 0, nowPos: 0, vp, g, opts: {}, L,
		};
		f.skin = this.skin;
		f.vp = vp;
		f.g = g;
		f.L = L;
		return f;
	}

	/** draw the whole frame at song time `now`; returns the geometry for play-only chrome */
	draw(now: number, vp: Viewport, opts: DrawOptions = {}): PlayfieldGeometry {
		const keys = this.game.keyCount;
		if (this.next?.maniaAssets(keys)) {
			this.skin = this.next;
			this.next = undefined;
		}
		const assets = this.skin.maniaAssets(keys);
		// nothing until decoded: a HUD without its stage lands in the wrong place
		if (!assets) return playfieldGeometry(this.game, this.skin, vp);
		const f = this.stage(assets, vp);
		f.now = now;
		f.nowPos = this.game.scroll.positionAt(now);
		f.opts = opts;
		const ctx = this.ctx;
		// behind the stage, which it slides out from
		this.comboBurst(f);
		ctx.save();
		if (f.L.upsideDown) {
			ctx.translate(0, vp.h);
			ctx.scale(1, -1);
		}
		const layers = assets.config.keysUnderNotes ? KEYS_UNDER : KEYS_OVER;
		for (let i = 0; i < layers.length; i++) layers[i](f);
		ctx.restore();
		this.hud(f, f);
		return f.g;
	}

}
