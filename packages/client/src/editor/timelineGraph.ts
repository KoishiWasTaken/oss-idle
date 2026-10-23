import {
	multiplierOf,
	type Note,
	type TimingPoint,
} from '@oss-idle/shared/editor/chart';

/** How loud the song is across `buckets` slices of `length` ms, 0 to 1 (RMS, scaled to the loudest). */
export const volumeOf = (
	song: { pcm: Float32Array, rate: number } | undefined,
	length: number,
	buckets: number,
): Float32Array => {
	const out = new Float32Array(buckets);
	if (!song || length <= 0) return out;
	const per = song.rate * length / 1000 / buckets;
	let loudest = 0;
	for (let b = 0; b < buckets; b++) {
		const from = Math.floor(b * per);
		const to = Math.min(song.pcm.length, Math.floor((b + 1) * per));
		let sum = 0;
		for (let i = from; i < to; i++) sum += song.pcm[i] * song.pcm[i];
		out[b] = to > from ? Math.sqrt(sum / (to - from)) : 0;
		loudest = Math.max(loudest, out[b]);
	}
	if (loudest > 0) for (let b = 0; b < buckets; b++) out[b] /= loudest;
	return out;
};

/** How dense the notes are across `buckets` slices of `length` ms, 0 to 1, smoothed over a
 *  few slices either side and scaled to the densest. */
export const densityOf = (notes: Note[], length: number, buckets: number): Float32Array => {
	const counts = new Float32Array(buckets);
	if (length <= 0) return counts;
	for (const note of notes) {
		const b = Math.min(buckets - 1, Math.max(0, Math.floor(note.time / length * buckets)));
		counts[b]++;
	}
	const reach = Math.max(1, Math.round(buckets / 100));
	const out = new Float32Array(buckets);
	let densest = 0;
	for (let b = 0; b < buckets; b++) {
		let sum = 0;
		for (let i = b - reach; i <= b + reach; i++) sum += counts[i] ?? 0;
		out[b] = sum;
		densest = Math.max(densest, sum);
	}
	if (densest > 0) for (let b = 0; b < buckets; b++) out[b] /= densest;
	return out;
};

/** The beat length the map spends longest at, up to `length`: its tempo's baseline. */
export const mainBeatLength = (timing: TimingPoint[], length: number): number => {
	const spent = new Map<number, number>();
	timing.forEach((point, i) => {
		const until = Math.max(point.time, timing[i + 1]?.time ?? length);
		spent.set(point.beatLength, (spent.get(point.beatLength) ?? 0) + until - point.time);
	});
	let main = timing[0]?.beatLength ?? 500;
	for (const [beatLength, time] of spent) if (time > (spent.get(main) ?? 0)) main = beatLength;
	return main;
};

/** How far a value strays from the baseline, 0 to 1: four times either way is all the way. */
export const strayOf = (value: number, baseline: number): number =>
	(value > 0 && baseline > 0 ? Math.min(1, Math.abs(Math.log(value / baseline)) / Math.log(4)) : 0);

/** How far each point strays from the map's baseline across `buckets` slices, 0 to 1, the most
 *  of any in a slice; -1 for none. Timing points by tempo against the main one, scroll speed
 *  points by speed against 1. */
export const straysOf = (
	points: TimingPoint[],
	kind: 'timing' | 'scroll',
	length: number,
	buckets: number,
): Float32Array => {
	const out = new Float32Array(buckets).fill(-1);
	if (length <= 0) return out;
	const main = kind === 'timing' ? mainBeatLength(points, length) : 0;
	for (const point of points) {
		const b = Math.min(buckets - 1, Math.max(0, Math.round(point.time / length * buckets)));
		const stray = kind === 'timing' ? strayOf(main, point.beatLength) : strayOf(multiplierOf(point), 1);
		out[b] = Math.max(out[b], stray);
	}
	return out;
};
