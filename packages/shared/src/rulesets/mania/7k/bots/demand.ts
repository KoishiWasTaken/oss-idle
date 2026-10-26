import type { BotContext } from '../../bot.js';
import type RuntimeNote from '../../runtimeNote.js';
import {
	handOf,
	type SkillName7k,
} from '../skills.js';

/** A map as the demands read it, worked out once per play. */
export type MapReading = {
	ctx: BotContext,
	/** notes starting at each time: a chord's width */
	chordAt: Map<number, number>,
	/** each note's place in the map, 0 first to 1 last */
	progress: Map<RuntimeNote, number>,
	holds: RuntimeNote[],
};

export const readMap = (ctx: BotContext): MapReading => {
	const chordAt = new Map<number, number>();
	const progress = new Map<RuntimeNote, number>();
	ctx.notes.forEach((note, i) => {
		chordAt.set(note.time, (chordAt.get(note.time) ?? 0) + 1);
		progress.set(note, i / Math.max(1, ctx.notes.length - 1));
	});
	return {
		ctx, chordAt, progress, holds: ctx.notes.filter(n => n.hold),
	};
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The same chord pressed again shortly before: a chordjack. */
const repeated = (note: RuntimeNote, { ctx }: MapReading) =>
	ctx.recentNotes(note.time, 200).some(n => n.column === note.column && n.time < note.time);

/** How far the two hands' onsets part in the last second: one hand on its own rhythm. */
const divergence = (note: RuntimeNote, { ctx }: MapReading) => {
	const recent = ctx.recentNotes(note.time, 1000);
	if (recent.length < 4) return 0;
	const times = {
		left: new Set<number>(), right: new Set<number>(), 
	};
	for (const n of recent) times[handOf(n.column)].add(n.time);
	const alone = recent.filter(n =>
		!times[handOf(n.column) === 'left' ? 'right' : 'left'].has(n.time)).length;
	return (alone / recent.length) * Math.min(1, recent.length / 16);
};

/**
 * How hard each note is on each skill, 0 easy to 1 the hardest. Placeholders: enough that
 * each skill strains on the patterns it names; the 4K rebalance shapes the real ones.
 */
export const DEMANDS: Record<SkillName7k, (note: RuntimeNote, map: MapReading) => number> = {
	accuracy: () => 0.3,
	speed: (note, { ctx }) => clamp01(ctx.npsAt(note.time, 1000) / 30),
	stamina: (note, { ctx }) => clamp01(ctx.npsAt(note.time, 30_000) / 20),
	chords: (note, map) =>
		clamp01((map.chordAt.get(note.time) ?? 1) / 7 + (repeated(note, map) ? 0.4 : 0)),
	independence: (note, map) => clamp01(divergence(note, map)),
	ln: (note, map) => clamp01(map.holds.filter(h => h !== note && h.time < note.time
		&& h.endTime > note.time).length / 4 + (note.hold ? 0.15 : 0)),
	technical: (note, { ctx }) => {
		const recent = ctx.recentNotes(note.time, 500);
		return clamp01(new Set(recent.map(n => n.column)).size / 7 * Math.min(1, recent.length / 10));
	},
	focus: (note, map) => clamp01((map.progress.get(note) ?? 0) * 0.6),
	sv: (note, { ctx }) => clamp01(Math.abs(ctx.scroll.getSpeedAt(note.time) - 1)),
	memory: () => 0,
};
