import {
	inEffect,
	multiplierOf,
	scrollBeatLength,
	snapLines,
	type TimingPoint,
} from '@oss-idle/shared/editor/chart';

/** A stretch of song time, [from, to]. */
export type Range = { from: number, to: number };

/** The SV multiplier in effect at `time`: 1 before the first point. */
export const speedAt = (scroll: TimingPoint[], time: number): number => {
	const point = inEffect(scroll, time);
	return point ? multiplierOf(point) : 1;
};

/** An SV point at `time`, sounding like the one in effect there. */
const pointAt = (scroll: TimingPoint[], time: number, multiplier: number): TimingPoint => {
	const like = inEffect(scroll, time);
	return {
		time: Math.round(time),
		beatLength: scrollBeatLength(multiplier),
		meter: like?.meter ?? 4,
		sound: like?.sound ?? '0,0,100',
		effects: '0',
	};
};

const byTime = (a: TimingPoint, b: TimingPoint) => a.time - b.time;

/** `scroll` with its points in [from, to) swapped for `inside`; with `restore`, the
 *  speed from `to` on stays what it was. */
const replaceRange = (
	scroll: TimingPoint[],
	{ from, to }: Range,
	inside: TimingPoint[],
	restore: boolean,
): TimingPoint[] => {
	const kept = scroll.filter(point => point.time < from || point.time >= to);
	const back = restore && !kept.some(point => point.time === to)
		? [pointAt(scroll, to, speedAt(scroll, to))]
		: [];
	return [...kept, ...inside, ...back].sort(byTime);
};

/** A ramp from `start` to `end` over the range, one point per 1/`divisor` beat line,
 *  ending on `end` at the range's end. */
export const linearScroll = (
	scroll: TimingPoint[],
	timing: TimingPoint[],
	divisor: number,
	range: Range,
	start: number,
	end: number,
): TimingPoint[] => {
	const { from, to } = range;
	const times = [from, ...snapLines(timing, from, to, divisor).map(line => line.time), to]
		.map(Math.round)
		.filter((time, i, all) => time >= from && time <= to && all.indexOf(time) === i);
	const inside = times.map(time =>
		pointAt(scroll, time, start + (end - start) * (time - from) / (to - from)));
	return replaceRange(scroll, {
		from, to: to + 1, 
	}, inside, false);
};

/** One speed over the range, then back to what came after it. */
export const constantScroll = (scroll: TimingPoint[], range: Range, speed: number): TimingPoint[] =>
	replaceRange(scroll, range, [pointAt(scroll, range.from, speed)], true);

/** Every speed in the range times `factor`, then back to what came after it. */
export const scaleScroll = (scroll: TimingPoint[], range: Range, factor: number): TimingPoint[] => {
	const { from, to } = range;
	const within = scroll.filter(point => point.time >= from && point.time < to);
	const scaled = within.map(point => ({
		...point, beatLength: scrollBeatLength(multiplierOf(point) * factor),
	}));
	const opening = within.some(point => point.time === from)
		? []
		: [pointAt(scroll, from, speedAt(scroll, from) * factor)];
	return replaceRange(scroll, range, [...opening, ...scaled], true);
};
