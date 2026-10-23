import { fft } from './fft';

/** Onset frames a second, and the FFT size each frame looks at. */
const FPS = 200;
const SIZE = 1024;
/** The tempos tried, and the one mapped songs centre on (a prior, in octaves). */
const MIN_BPM = 60;
const MAX_BPM = 300;
const PRIOR_BPM = 175;
const PRIOR_OCTAVES = 0.5;

export type BpmGuess = {
	bpm: number,
	/** 0-1: how many of the song's growing stretches agree on it */
	confidence: number,
	/** where the first beat falls, ms */
	offset: number,
};

/** How much new sound starts in each frame (the spectral flux), local mean taken off. */
const onsets = (pcm: Float32Array, rate: number) => {
	const hop = Math.round(rate / FPS);
	const frames = Math.max(0, Math.floor((pcm.length - SIZE) / hop));
	const re = new Float32Array(SIZE);
	const im = new Float32Array(SIZE);
	const window = new Float32Array(SIZE).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / SIZE));
	let last = new Float32Array(SIZE / 2);
	let next = new Float32Array(SIZE / 2);
	const all = new Float32Array(frames);
	for (let f = 0; f < frames; f++) {
		for (let i = 0; i < SIZE; i++) {
			re[i] = pcm[f * hop + i] * window[i];
			im[i] = 0;
		}
		fft(re, im);
		let sum = 0;
		for (let b = 1; b < SIZE / 2; b++) {
			next[b] = Math.log1p(Math.hypot(re[b], im[b]));
			sum += Math.max(0, next[b] - last[b]);
		}
		all[f] = sum;
		[last, next] = [next, last];
	}
	return {
		all: aboveMean(all), fps: rate / hop,
	};
};

/** What stays above half a second's running mean. */
const aboveMean = (flux: Float32Array): Float32Array => {
	const span = Math.round(FPS / 2);
	const out = new Float32Array(flux.length);
	let run = 0;
	for (let f = 0; f < flux.length; f++) {
		run += flux[f] - (f >= span ? flux[f - span] : 0);
		out[f] = Math.max(0, flux[f] - run / Math.min(f + 1, span));
	}
	return out;
};

/** How strongly the onsets of `o[0, length)` repeat every `period` frames: the size of
 *  their Fourier component there (a tempogram). */
const pulse = (o: Float32Array, length: number, period: number): number => {
	const w = 2 * Math.PI / period;
	let re = 0;
	let im = 0;
	for (let i = 0; i < length; i++) {
		re += o[i] * Math.cos(w * i);
		im += o[i] * Math.sin(w * i);
	}
	return Math.hypot(re, im);
};

const prior = (bpm: number) => Math.exp(-0.5 * (Math.log2(bpm / PRIOR_BPM) / PRIOR_OCTAVES) ** 2);

/** The tempo, in steps of `step` BPM, whose pulse is strongest over `o[0, length)`. */
const tempoOf = (
	o: Float32Array,
	fps: number,
	length: number,
	[from, to]: [number, number],
	step: number,
	weigh: boolean,
) => {
	let best = from;
	let bestScore = -Infinity;
	for (let bpm = from; bpm <= to; bpm += step) {
		const score = pulse(o, length, 60 * fps / bpm) * (weigh ? prior(bpm) : 1);
		if (score > bestScore) {
			bestScore = score;
			best = bpm;
		}
	}
	return best;
};

/** The mean onset on the best-placed grid of beats `period` frames apart. */
const gridStrength = (o: Float32Array, period: number): number => {
	let best = 0;
	for (let p = 0; p < period; p += 0.5) {
		let sum = 0;
		let n = 0;
		for (let t = p; t < o.length - 1; t += period, n++) {
			const i = Math.floor(t);
			sum += Math.max(o[i], o[i + 1]);
		}
		best = Math.max(best, sum / n);
	}
	return best;
};

/** The tempo among `bpm`'s relatives (halves, thirds, quarters off) whose beats land on the
 *  most onsets, weighed by where mapped songs sit: a pulse at 3/4 of the beat fools the
 *  tempogram, not a grid. */
const beatTempo = (o: Float32Array, fps: number, bpm: number): number => {
	const relatives = [1, 2, 0.5, 4 / 3, 0.75, 1.5, 2 / 3]
		.map(r => bpm * r).filter(b => b >= MIN_BPM && b <= MAX_BPM);
	return relatives.reduce((best, b) => {
		const score = gridStrength(o, 60 * fps / b) * prior(b);
		return score > best.score ? {
			bpm: b, score,
		} : best;
	}, {
		bpm, score: -Infinity,
	}).bpm;
};

/** From a frame's start to the beat it hears, ms: measured against the offsets of 40
 *  ranked maps (half the window, less how soon the flux rises). */
const ONSET_LAG_MS = -8;

/** Where in a beat (0 to `period` frames) a grid lands on the most onsets of
 *  `o[from, from + length)`. */
const gridPhase = (o: Float32Array, from: number, length: number, period: number): number => {
	const end = Math.min(o.length - 1, from + length);
	let best = 0;
	let bestSum = -Infinity;
	for (let p = 0; p < period; p += 0.25) {
		let sum = 0;
		for (let t = p + Math.ceil((from - p) / period) * period; t < end; t += period) {
			const i = Math.floor(t);
			sum += o[i] + (o[i + 1] - o[i]) * (t - i);
		}
		if (sum > bestSum) {
			bestSum = sum;
			best = p;
		}
	}
	return best;
};

/** Onsets under this are no sound at all. */
const SILENCE = 1e-3;

/** A guess at the song's tempo, its confidence and its first beat, like Quaver's detector. */
export const detectBpm = (pcm: Float32Array, rate: number): BpmGuess | undefined => {
	const { all, fps } = onsets(pcm, rate);
	if (all.length < fps * 4 || !all.some(v => v > SILENCE)) return undefined;
	// growing stretches vote on the rough tempo
	const votes = new Map<number, number>();
	for (let i = 1; i <= 10; i++) {
		const length = Math.floor(all.length * i / 10);
		const bpm = Math.round(tempoOf(all, fps, length, [MIN_BPM, MAX_BPM], 1, true));
		votes.set(bpm, (votes.get(bpm) ?? 0) + 1);
	}
	const [voted, count] = [...votes].reduce((a, b) => (b[1] > a[1] ? b : a));
	const rough = beatTempo(all, fps, voted);
	// the whole song pins it down; a whole tempo is taken as meant
	const fine = tempoOf(all, fps, all.length, [rough - 1.5, rough + 1.5], 0.01, false);
	const whole = Math.abs(fine - Math.round(fine)) < 0.15;
	const bpm = whole ? Math.round(fine) : Math.round(fine * 100) / 100;
	// the beat grid that lands on the most onsets: its first beat at or after 0
	const first = gridPhase(all, 0, all.length, 60 * fps / bpm);
	const offset = first / fps * 1000 + ONSET_LAG_MS;
	return {
		bpm, confidence: count / 10, offset: Math.round(offset),
	};
};
