import Reading from '@oss-idle/shared/sim/skills/reading';
import Speed from '@oss-idle/shared/sim/skills/speed';
import num from '@oss-idle/shared/display/num';
import {
	Skills,
	type SkillName,
} from '@oss-idle/shared/skills';
import { type Grade } from '@oss-idle/shared/judgement';
import { MAX_HP } from '@oss-idle/shared/sim/scoring';
import { BAR_ZONES } from '@oss-idle/shared/fatigue';
import { drawHitErrorBar } from '../hitError';
import {
	roundRect,
	STRAIN_HUD_SKILLS,
	type Frame,
	type StrainHud,
	type Viewport,
} from './frame';
import { makeStageHud } from './stageHud';
import type { StageFrame } from './stage';

const HP_EASE_MS = 200;

const TRACK = 'rgba(255,255,255,0.12)';
const GAUGE_W = 150;
const BAR_H = 6;

// the warm-up bar's zones, left to right: cold, the sweet spot, past the peak, fatigued
const ZONE_COLORS = ['#4da3ff', '#ffd34d', '#ff9a4d', '#b48cff'];

// spans the bar from the origin: cold blue, gold through the sweet spot, orange, fatigue purple
let barFill: CanvasGradient | undefined;
const warmupFill = (ctx: CanvasRenderingContext2D) => {
	if (barFill) return barFill;
	const [peak, pushing, fatigued] = BAR_ZONES;
	barFill = ctx.createLinearGradient(0, 0, GAUGE_W, 0);
	barFill.addColorStop(0, ZONE_COLORS[0]);
	barFill.addColorStop(peak, ZONE_COLORS[1]);
	barFill.addColorStop(pushing, ZONE_COLORS[1]);
	barFill.addColorStop(fatigued, ZONE_COLORS[2]);
	barFill.addColorStop(1, ZONE_COLORS[3]);
	return barFill;
};

const zoneOf = (v: number) => {
	let i = 0;
	while (i < BAR_ZONES.length && v >= BAR_ZONES[i]) i++;
	return i;
};

// one gauge row: label, % and a bar - just the label and a tinted % when compact
const drawGauge = (
	f: Frame,
	label: string,
	v: number,
	color: string,
	bx: number,
	by: number,
) => {
	const { ctx, vp } = f;
	ctx.textAlign = 'left';
	ctx.fillStyle = 'rgba(255,255,255,0.75)';
	ctx.fillText(label, bx, by);
	if (vp.w < 700) {
		ctx.fillStyle = color;
		ctx.fillText(`${Math.round(v * 100)}%`, bx, by + 13);
		return;
	}
	ctx.textAlign = 'right';
	ctx.fillText(`${Math.round(v * 100)}%`, bx + GAUGE_W, by);
	ctx.fillStyle = TRACK;
	roundRect(ctx, bx, by + 5, GAUGE_W, 8, 4);
	ctx.fill();
	if (v > 0.005) {
		ctx.fillStyle = color;
		roundRect(ctx, bx, by + 5, Math.max(8, GAUGE_W * v), 8, 4);
		ctx.fill();
	}
};

// a hit error bar for warm-up: the zones, a centre line, and a needle where the character sits
export const drawWarmupGauge = (
	f: Frame,
	label: string,
	state: string,
	v: number,
	bx: number,
	by: number,
) => {
	const { ctx, vp } = f;
	const zone = zoneOf(v);
	ctx.textAlign = 'left';
	ctx.fillStyle = 'rgba(255,255,255,0.75)';
	ctx.fillText(label, bx, by);
	ctx.fillStyle = ZONE_COLORS[zone];
	if (vp.w < 700) {
		ctx.fillText(state, bx, by + 13);
		return;
	}
	ctx.textAlign = 'right';
	ctx.fillText(state, bx + GAUGE_W, by);
	const y = by + 6;
	ctx.save();
	ctx.translate(bx, y);
	ctx.fillStyle = warmupFill(ctx);
	ctx.fillRect(0, 0, GAUGE_W, BAR_H);
	ctx.restore();
	ctx.fillStyle = 'rgba(255,255,255,0.6)';
	ctx.fillRect(bx + GAUGE_W / 2 - 0.5, y - 2, 1, BAR_H + 4);
	const x = bx + v * GAUGE_W;
	ctx.save();
	ctx.shadowColor = ZONE_COLORS[zone];
	ctx.shadowBlur = zone === 1 ? 8 + 4 * Math.sin(performance.now() / 250) : 6;
	ctx.fillStyle = '#fff';
	ctx.fillRect(x - 1, y - 3, 2, BAR_H + 6);
	ctx.beginPath();
	ctx.moveTo(x, y + BAR_H + 4);
	ctx.lineTo(x - 4, y + BAR_H + 10);
	ctx.lineTo(x + 4, y + BAR_H + 10);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
};

type Size = Pick<Viewport, 'w' | 'h'>;
const strainStep = (vp: Size) => vp.w < 700 ? 30 : 26;
const strainTop = (vp: Size) => Math.max(150, vp.h * 0.24);

/** the warm-up bar with its label and state, for a hover area over the canvas */
export const warmupGaugeBox = (vp: Size, left = 16) => ({
	left,
	top: strainTop(vp) + STRAIN_HUD_SKILLS.length * strainStep(vp),
	width: GAUGE_W,
	height: 32,
});

// strain meters (left side): one stress gauge per skill, 0-100%. Narrow screens
// drop the bars and show just the %, tinted the gauge's colour. `display` carries
// the eased value between frames so per-note jumps read as motion.
const drawStrainMeters = (
	f: Frame,
	strain: StrainHud,
	display: Record<SkillName, number>,
) => {
	const { ctx, now, vp } = f;
	const strains = strain.bot.strainsAt(now);
	const bx = strain.left ?? 16;
	const step = strainStep(vp);
	const by0 = strainTop(vp);
	ctx.font = '600 11px "Exo 2", sans-serif';
	STRAIN_HUD_SKILLS.forEach((skill, i) => {
		const v = display[skill] += (strains[skill] - display[skill]) * 0.2;
		// calm green → stressed red
		drawGauge(f, strain.labels[skill], v, `hsl(${120 - v * 120}, 85%, 55%)`, bx, by0 + i * step);
	});
	if (strain.warmupBar === undefined) return;
	drawWarmupGauge(
		f,
		strain.warmupLabel ?? '',
		strain.warmupState ?? '',
		strain.warmupBar,
		bx,
		by0 + STRAIN_HUD_SKILLS.length * step + 12,
	);
};

// debug-only telemetry over the playfield (nps, visible notes, transitions, ...)
const drawDebugStats = (f: Frame, cxField: number) => {
	const { ctx, game, now, vp } = f;
	ctx.fillStyle = '#fff';
	ctx.font = '800 23px "Exo 2", sans-serif';
	ctx.textAlign = 'center';
	ctx.fillText(`${game.npsAt(now)}nps`, cxField, vp.h * 0.32);
	ctx.fillText(`${game.visibleNotesAt(now).length}v`, cxField, vp.h * 0.28);
	ctx.fillText(`${Reading.countTransitions(
		new Map(),
		game.visibleNotesAt(now))}t`,
	cxField,
	vp.h * 0.36,
	);
	ctx.fillText(
		`${num(Speed.weightedGroups(
			new Map(),
			game.recentNotes(now),
		), 2)}g`,
		cxField,
		vp.h * 0.39,
	);
	ctx.textAlign = 'left';
	ctx.fillText(
		`x${Math.round(game.scroll.getSpeedAt(now) * 100) / 100}`,
		15,
		vp.h * 0.1,
	);
};

/**
 * The HUD layer: the skin's hit burst, combo, score, accuracy and HP bar (render/stageHud),
 * then ours - strain gauges, progress bar, hit-error bar. A factory because the HP and
 * strain gauges carry eased state between frames; the grade badge is a DOM element in the
 * caller, fed via `opts.onGrade` only when the grade changes.
 */
export const makeHud = () => {
	const strainDisplay =
		Object.fromEntries(Skills.map(s => [s, 0])) as Record<SkillName, number>;
	const stageHud = makeStageHud();
	// filled in every frame rather than made anew
	let errorBar: Parameters<typeof drawHitErrorBar>[2] | undefined;
	let hpEased = 1;
	let hpLast = performance.now();
	let lastGrade: Grade | undefined;

	return (f: Frame, stage?: StageFrame) => {
		const { ctx, game, now, vp, g, opts } = f;
		const cxField = g.x0 + g.fieldWidth / 2;

		// eased toward the live value, like stable's bar
		const tNow = performance.now();
		hpEased += (game.score.hp / MAX_HP - hpEased) * (1 - Math.exp(-(tNow - hpLast) / HP_EASE_MS));
		hpLast = tNow;
		if (stage) stageHud(stage, hpEased, opts.mobile ? 60 : 0);

		if (opts.debug) drawDebugStats(f, cxField);
		if (opts.strain) drawStrainMeters(f, opts.strain, strainDisplay);

		// current grade badge (a DOM <img> in the caller, fed on change only)
		if (game.score.grade !== lastGrade) {
			lastGrade = game.score.grade;
			opts.onGrade?.(game.score.grade);
		}

		// progress bar
		const prog = Math.max(0, Math.min(1, now / game.songEndMs));
		ctx.fillStyle = 'rgba(255,255,255,0.12)';
		ctx.fillRect(0, 0, vp.w, 4);
		ctx.fillStyle = '#ff66ab';
		ctx.fillRect(0, 0, vp.w * prog, 4);

		// hit-error bar: bottom centre of the screen, whatever the stage
		errorBar ??= {
			windows: game.windows, hits: game.hits, now, cx: 0, y: 0, halfWidth: 170,
		};
		errorBar.windows = game.windows;
		errorBar.hits = game.hits;
		errorBar.now = now;
		errorBar.cx = vp.w / 2;
		errorBar.y = vp.h - 14;
		drawHitErrorBar(f.skin, ctx, errorBar);
	};
};
