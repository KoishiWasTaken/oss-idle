import Reading from '@oss-idle/shared/sim/skills/reading';
import accuracy from '@oss-idle/shared/display/accuracy';
import Speed from '@oss-idle/shared/sim/skills/speed';
import num from '@oss-idle/shared/display/num';
import {
	Skills,
	type SkillName,
} from '@oss-idle/shared/skills';
import { type Grade } from '@oss-idle/shared/judgement';
import { MAX_HP } from '@oss-idle/shared/sim/scoring';
import { drawHpBar } from '../hpBar';
import { drawHitErrorBar } from '../hitError';
import {
	roundRect,
	STRAIN_HUD_SKILLS,
	type Frame,
	type Layer,
	type StrainHud,
} from './frame';

const FATIGUE_COLOR = '#b48cff';
const GOLD = '#ffd34d';
const COOL_GLOW = '#2b4fd8';
const COOL_TRACK = 'rgba(25,45,140,0.7)';
const TRACK = 'rgba(255,255,255,0.12)';
const GAUGE_W = 150;
const SHINE_W = 40;
const SHINE_MS = 1600;

// spans the whole gauge, so a cold warm-up only shows the red end
let warmupFill: CanvasGradient | undefined;
let goldShine: CanvasGradient | undefined;
const gradients = (ctx: CanvasRenderingContext2D) => {
	if (!warmupFill) {
		warmupFill = ctx.createLinearGradient(0, 0, GAUGE_W, 0);
		warmupFill.addColorStop(0, '#ff4d4d');
		warmupFill.addColorStop(0.5, '#ffa64d');
		warmupFill.addColorStop(0.75, '#c6e04d');
		warmupFill.addColorStop(1, '#4de06a');
	}
	if (!goldShine) {
		goldShine = ctx.createLinearGradient(-SHINE_W, 0, 0, 0);
		goldShine.addColorStop(0, 'rgba(255,225,120,0)');
		goldShine.addColorStop(0.5, 'rgba(255,245,200,0.95)');
		goldShine.addColorStop(1, 'rgba(255,225,120,0)');
	}
	return {
		fill: warmupFill,
		shine: goldShine,
	};
};

// red → orange → green, the tint of the warm-up gauge's % on narrow screens
const warmupHue = (v: number) => v < 0.5 ? v * 60 : 30 + (v - 0.5) * 230;

// one gauge row: label, % and a bar - just the label and a tinted % when compact
const drawGauge = (
	f: Frame,
	label: string,
	v: number,
	color: string,
	bx: number,
	by: number,
	fill: string | CanvasGradient = color,
	track = TRACK,
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
	ctx.fillStyle = track;
	roundRect(ctx, bx, by + 5, GAUGE_W, 8, 4);
	ctx.fill();
	if (v > 0.005) {
		// drawn from the origin so a gradient fill lines up wherever the gauge sits
		ctx.save();
		ctx.translate(bx, by + 5);
		ctx.fillStyle = fill;
		roundRect(ctx, 0, 0, Math.max(8, GAUGE_W * v), 8, 4);
		ctx.fill();
		ctx.restore();
	}
};

// full warm-up: a pulsing gold glow and rim, and a gold shine sweeping across
const drawWarmedUp = (
	ctx: CanvasRenderingContext2D,
	shine: CanvasGradient,
	bx: number,
	by: number,
) => {
	const t = performance.now();
	ctx.save();
	ctx.translate(bx, by + 5);
	roundRect(ctx, 0, 0, GAUGE_W, 8, 4);
	ctx.shadowColor = GOLD;
	ctx.shadowBlur = 8 + 4 * Math.sin(t / 250);
	ctx.strokeStyle = GOLD;
	ctx.lineWidth = 1.5;
	ctx.stroke();
	ctx.shadowBlur = 0;
	ctx.clip();
	ctx.translate((t % SHINE_MS) / SHINE_MS * (GAUGE_W + SHINE_W * 2), 0);
	ctx.fillStyle = shine;
	ctx.fillRect(-SHINE_W, 0, SHINE_W, 8);
	ctx.restore();
};

// past the peak: the dark blue track the warm-up drains into, under a pulsing dark blue glow
const drawCooling = (ctx: CanvasRenderingContext2D, bx: number, by: number) => {
	ctx.save();
	roundRect(ctx, bx, by + 5, GAUGE_W, 8, 4);
	ctx.shadowColor = COOL_GLOW;
	ctx.shadowBlur = 8 + 4 * Math.sin(performance.now() / 400);
	ctx.strokeStyle = COOL_GLOW;
	ctx.lineWidth = 1.5;
	ctx.stroke();
	ctx.restore();
};

export const drawWarmupGauge = (
	f: Frame,
	label: string,
	v: number,
	cooling: boolean,
	bx: number,
	by: number,
) => {
	const full = v >= 0.995;
	const cool = cooling && !full;
	const { fill, shine } = gradients(f.ctx);
	const color = full ? GOLD : `hsl(${warmupHue(v)}, 85%, 55%)`;
	drawGauge(f, label, v, color, bx, by, fill, cool ? COOL_TRACK : TRACK);
	if (f.vp.w < 700) return;
	if (full) drawWarmedUp(f.ctx, shine, bx, by);
	else if (cool) drawCooling(f.ctx, bx, by);
};

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
	const step = vp.w < 700 ? 30 : 26;
	const by0 = Math.max(150, vp.h * 0.24);
	ctx.font = '600 11px "Exo 2", sans-serif';
	STRAIN_HUD_SKILLS.forEach((skill, i) => {
		const v = display[skill] += (strains[skill] - display[skill]) * 0.2;
		// calm green → stressed red
		drawGauge(f, strain.labels[skill], v, `hsl(${120 - v * 120}, 85%, 55%)`, bx, by0 + i * step);
	});
	if (strain.fatigue === undefined) return;
	// how tired the character plays this map, fixed for the whole play
	const fy = by0 + STRAIN_HUD_SKILLS.length * step + 12;
	drawGauge(f, strain.fatigueLabel ?? '', strain.fatigue, FATIGUE_COLOR, bx, fy);
	if (strain.warmup === undefined) return;
	drawWarmupGauge(f, strain.warmupLabel ?? '', strain.warmup, strain.cooling ?? false, bx, fy + step);
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
 * The HUD layer: judgement popup, combo, strain gauges, accuracy/score, progress
 * bar, HP bar and hit-error bar. A factory because the HP and strain gauges carry
 * eased state between frames; the grade badge is a DOM element in the caller, fed
 * via `opts.onGrade` only when the grade changes.
 */
export const makeHud = (): Layer => {
	const strainDisplay =
		Object.fromEntries(Skills.map(s => [s, 0])) as Record<SkillName, number>;
	let hpEased = 1;
	let hpLast = performance.now();
	let lastGrade: Grade | undefined;

	return (f) => {
		const { ctx, game, skin, now, vp, g, opts } = f;
		const cxField = g.x0 + g.fieldWidth / 2;

		// judgement popup
		const flash = game.lastFlash;
		if (flash) {
			const age = now - flash.time;
			if (age >= 0 && age < 400) {
				ctx.globalAlpha = 1 - age / 400;
				ctx.fillStyle = skin.data.judgements[flash.judgement].judge;
				ctx.font = '700 26px "Exo 2", sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText(skin.data.judgements[flash.judgement].text, cxField, g.lineY - 90);
				ctx.globalAlpha = 1;
			}
		}
		// combo
		if (game.score.combo > 1) {
			ctx.fillStyle = '#fff';
			ctx.font = '800 44px "Exo 2", sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(`${game.score.combo}x`, cxField, vp.h * 0.42);
		}

		if (opts.debug) drawDebugStats(f, cxField);
		if (opts.strain) drawStrainMeters(f, opts.strain, strainDisplay);

		// current grade badge (a DOM <img> in the caller, fed on change only)
		if (game.score.grade !== lastGrade) {
			lastGrade = game.score.grade;
			opts.onGrade?.(game.score.grade);
		}

		// accuracy + score (top right)
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'right';
		ctx.font = '700 30px "Exo 2", sans-serif';
		ctx.fillText(
			accuracy(game.score.accuracy),
			vp.w - 28,
			opts.mobile ? 90 : 48,
		);
		ctx.font = '500 18px "Exo 2", sans-serif';
		ctx.fillStyle = 'rgba(255,255,255,0.75)';
		ctx.fillText(
			Math.round(game.score.score).toLocaleString(),
			vp.w - 28,
			opts.mobile ? 120 : 76,
		);

		// progress bar
		const prog = Math.max(0, Math.min(1, now / game.songEndMs));
		ctx.fillStyle = 'rgba(255,255,255,0.12)';
		ctx.fillRect(0, 0, vp.w, 4);
		ctx.fillStyle = '#ff66ab';
		ctx.fillRect(0, 0, vp.w * prog, 4);

		// HP bar (right of the playfield) - eased toward the live value, drawn before
		// the hit-error bar so that bar stays on top of it
		const tNow = performance.now();
		const transition = (1 - Math.exp(-(tNow - hpLast) / skin.data.hpBar.transitionMs));
		hpEased += (game.score.hp / MAX_HP - hpEased) * transition;
		hpLast = tNow;
		drawHpBar(skin, ctx, {
			hp: hpEased,
			x: g.x0 + g.fieldWidth + skin.data.hpBar.gap,
			bottom: vp.h - skin.data.hpBar.fromBottom,
		});

		// hit-error bar (below the receptors)
		drawHitErrorBar(skin, ctx, {
			windows: game.windows,
			hits: game.hits,
			now,
			cx: cxField,
			y: g.lineY + 78,
			halfWidth: Math.min(170, g.fieldWidth / 2),
		});
	};
};
