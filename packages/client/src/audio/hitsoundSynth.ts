/**
 * The default hitsounds, made in code: osu!'s twelve roles (normal / soft / drum x
 * hitnormal / whistle / finish / clap), our own sounds. Pure maths over sample arrays,
 * so the game fills its buffers with them and a script can render them to files.
 */

export const SAMPLE_SETS = ['normal', 'soft', 'drum'] as const;
export const HIT_SOUNDS = ['hitnormal', 'hitwhistle', 'hitfinish', 'hitclap'] as const;
export type SampleSetName = typeof SAMPLE_SETS[number];
export type HitSoundName = typeof HIT_SOUNDS[number];

/** A small seeded noise source: the same sound every time. */
const noise = (seed: number) => {
	let state = seed >>> 0 || 1;
	return () => {
		state ^= state << 13;
		state ^= state >>> 17;
		state ^= state << 5;
		return (state >>> 0) / 0x80000000 - 1;
	};
};

/** A biquad band-pass (RBJ), centred on `frequency`. */
const bandPass = (rate: number, frequency: number, q: number) => {
	const w = 2 * Math.PI * frequency / rate;
	const alpha = Math.sin(w) / (2 * q);
	const a0 = 1 + alpha;
	const b0 = alpha / a0, b2 = -alpha / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - alpha) / a0;
	let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
	return (x: number) => {
		const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
		x2 = x1; x1 = x; y2 = y1; y1 = y;
		return y;
	};
};

/** A one-pole high-pass: keeps what is above `frequency`. */
const highPass = (rate: number, frequency: number) => {
	const k = Math.exp(-2 * Math.PI * frequency / rate);
	let lastIn = 0, lastOut = 0;
	return (x: number) => {
		lastOut = k * (lastOut + x - lastIn);
		lastIn = x;
		return lastOut;
	};
};

/** An exponential decay from 1 that falls `rate` nepers a second. */
const decay = (t: number, perSecond: number) => Math.exp(-t * perSecond);

/** A sine sweeping from `from` Hz down towards `to` Hz, `sweep` per second. */
const sweptSine = (rate: number, from: number, to: number, sweep: number) => {
	let phase = 0;
	return (t: number) => {
		const frequency = to + (from - to) * Math.exp(-t * sweep);
		phase += 2 * Math.PI * frequency / rate;
		return Math.sin(phase);
	};
};

/** Bursts of filtered noise a few ms apart, then a tail: a clap. */
const clap = (rate: number, seed: number, centre: number, q: number, tail: number) => {
	const rand = noise(seed);
	const band = bandPass(rate, centre, q);
	const bursts = [0, 0.011, 0.022, 0.034];
	return (t: number) => {
		const burst = bursts.reduce((env, at) => (t >= at ? Math.max(env, decay(t - at, 160)) : env), 0);
		const body = t >= 0.034 ? decay(t - 0.034, tail) : 0;
		return band(rand()) * Math.max(burst, body * 0.9) * 3.2;
	};
};

/** Bright noise that swells for `attack` s and fades: a cymbal. */
const cymbal = (rate: number, seed: number, cutoff: number, attack: number, fade: number) => {
	const rand = noise(seed);
	const high = highPass(rate, cutoff);
	const ring = bandPass(rate, cutoff * 1.6, 1.4);
	return (t: number) => {
		const swell = attack > 0 ? Math.min(1, t / attack) : 1;
		const n = high(rand());
		return (n * 0.8 + ring(n) * 1.6) * swell * decay(Math.max(0, t - attack), fade);
	};
};

/** An RBJ biquad: band-pass around `frequency`, or low- / high-pass above / below it. */
const biquad = (
	rate: number,
	kind: 'band' | 'low' | 'high',
	frequency: number,
	q = Math.SQRT1_2,
) => {
	const w = 2 * Math.PI * Math.min(frequency, rate * 0.45) / rate;
	const cos = Math.cos(w);
	const alpha = Math.sin(w) / (2 * q);
	const a0 = 1 + alpha;
	const [b0, b1, b2] = {
		band: [alpha, 0, -alpha],
		low: [(1 - cos) / 2, 1 - cos, (1 - cos) / 2],
		high: [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2],
	}[kind].map(b => b / a0);
	const a1 = -2 * cos / a0, a2 = (1 - alpha) / a0;
	let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
	return (x: number) => {
		const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
		x2 = x1; x1 = x; y2 = y1; y1 = y;
		return y;
	};
};

/** Filtered noise at `level`, falling `perSecond` from the start; `cap` cuts it above. */
const hiss = (
	rate: number,
	seed: number,
	filter: ['band' | 'low' | 'high', number, number?],
	level: number,
	perSecond: number,
	cap?: number,
) => {
	const rand = noise(seed);
	const pass = biquad(rate, ...filter);
	const under = cap === undefined ? (x: number) => x : biquad(rate, 'low', cap);
	return (t: number) => under(pass(rand())) * level * decay(t, perSecond);
};

/** Sines at `freqs`, each with its level and fall, all bent `bend` sharp at first. */
const modes = (
	rate: number,
	partials: [number, number, number][],
	bend = 0,
	sweep = 1,
) => {
	const phases = partials.map(() => 0);
	return (t: number) => {
		const bent = 1 + bend * Math.exp(-t * sweep);
		return partials.reduce((sum, [frequency, level, die], i) => {
			phases[i] += 2 * Math.PI * frequency * bent / rate;
			return sum + Math.sin(phases[i]) * level * decay(t, die);
		}, 0);
	};
};

type Voice = { seconds: number, sample: (t: number) => number };

/** How each sound is made, its length, and its level. */
const voices = (rate: number): Record<`${SampleSetName}-${HitSoundName}`, Voice> => {
	const tone = (frequency: number) => (t: number) => Math.sin(2 * Math.PI * frequency * t);
	return {
		'normal-hitnormal': (() => {
			const click = hiss(rate, 11, ['high', 4840, 0.7], 1.572, 1629);
			const knock = sweptSine(rate, 476.4, 190.9, 75.71);
			const air = hiss(rate, 12, ['band', 3258, 0.1611], 1.234, 15.65);
			const tail = tone(229.6);
			return {
				seconds: 0.44,
				sample: (t: number) => click(t) + knock(t) * 0.9783 * decay(t, 34.7) + air(t)
					+ tail(t) * 0.03175 * decay(t, 8.742),
			};
		})(),
		'normal-hitwhistle': (() => {
			// a 330 Hz tone, its third harmonic the loudest, over a short low thunk
			const harmonics: [number, number][] = [
				[1, 0.09801], [2, 0.402], [3, 0.9985], [4, 0.6489], [6, 0.1846], [8, 0.15], [9, 0.12],
			];
			const whistle = modes(rate, harmonics.map(([k, level]) =>
				[330.6 * k, level, 20.3 + (12.61 - 20.3) * (k - 1) / 8]));
			const thunk = sweptSine(rate, 444.7, 202.5, 69.73);
			const air = hiss(rate, 21, ['band', 5769, 1.039], 5.084, 21.27, 15710);
			return {
				seconds: 0.51,
				sample: (t: number) => whistle(t) * Math.min(1, t / 0.004667)
					+ thunk(t) * 0.7228 * decay(t, 51.04) + air(t),
			};
		})(),
		'normal-hitfinish': (() => {
			const crash = cymbal(rate, 23, 3200, 0.012, 5.2);
			const thump = sweptSine(rate, 160, 80, 30);
			return {
				seconds: 0.75, sample: (t: number) => crash(t) * 0.9 + thump(t) * decay(t, 18) * 0.45,
			};
		})(),
		'normal-hitclap': {
			seconds: 0.36, sample: clap(rate, 31, 1450, 1.6, 14),
		},
		'soft-hitnormal': (() => {
			const rand = noise(13);
			const band = bandPass(rate, 6700, 2.2);
			return {
				seconds: 0.5, sample: (t: number) => band(rand()) * decay(t, 14) * 1.5,
			};
		})(),
		'soft-hitwhistle': (() => {
			// clusters of close partials, beating: level and fall per cluster
			const clusters: [number[], number, number][] = [
				[[2062, 2087, 2110, 2206], 0.08841, 5.57],
				[[4386, 4464], 0.2998, 13.51],
				[[5450, 5555, 5631, 5688, 5774, 5962, 6092, 6118], 0.205, 7.623],
				[[8084, 8916, 9045, 9232, 9536, 9579, 9828], 0.1579, 37.55],
				[[11530, 13470, 13709], 0.3023, 26],
			];
			const ring = modes(rate, clusters.flatMap(([freqs, level, die]) =>
				freqs.map((f): [number, number, number] => [f, level, die])));
			const air = hiss(rate, 22, ['band', 5703, 0.6144], 2.233, 8.039);
			return {
				seconds: 1.06, sample: (t: number) => ring(t) * Math.min(1, t / 0.003) + air(t),
			};
		})(),
		'soft-hitfinish': (() => {
			const thump = sweptSine(rate, 513.1, 361.3, 45.95);
			const ring = modes(rate, [2143, 2196, 2237, 2301, 2336, 2431, 2509]
				.map((f): [number, number, number] => [f, 0.355, 7.827]));
			const shine = modes(rate, [6263, 6298, 6681]
				.map((f): [number, number, number] => [f, 0.617, 19.5]));
			const air = hiss(rate, 23, ['high', 2055, 0.7], 2.718, 9.581, 11360);
			const click = hiss(rate, 24, ['band', 4516, 1], 3.267, 100.1, 9748);
			return {
				seconds: 0.92,
				sample: (t: number) => thump(t) * 0.8569 * decay(t, 24.24)
					+ ring(t) * Math.min(1, t / 0.03682) + shine(t) + air(t) + click(t),
			};
		})(),
		'soft-hitclap': {
			seconds: 0.32, sample: clap(rate, 37, 1300, 1.1, 18),
		},
		'drum-hitnormal': (() => {
			// a 153 Hz drum note over the noise of its skin and body
			const note = modes(rate, [[153, 1, 11.97]], 0.2416, 35.86);
			const thock = hiss(rate, 36, ['band', 508.3, 1.775], 8.512, 88.58);
			const body = hiss(rate, 33, ['low', 650.9], 2.374, 11.64, 650.9);
			const skin = hiss(rate, 34, ['band', 1969, 0.3227], 1.92, 12.43, 16000);
			const rumble = hiss(rate, 35, ['low', 86.66], 1.411, 21.14, 86.66);
			const click = hiss(rate, 31, ['band', 2759, 0.9881], 3.212, 661.7, 8707);
			const air = hiss(rate, 32, ['high', 3823, 0.7], 1.097, 35.85, 15450);
			return {
				seconds: 1.66,
				sample: (t: number) => note(t) + thock(t) + body(t) + skin(t) + rumble(t) + click(t) + air(t),
			};
		})(),
		'drum-hitwhistle': (() => {
			const tom = sweptSine(rate, 500.5, 438.4, 46.13);
			const low = tone(248);
			const sub = modes(rate, [[118, 0.1275, 10.04], [186, 0.1275, 10.04]]);
			const brush = hiss(rate, 41, ['band', 5839, 0.3484], 4.436, 55.53, 11620);
			const body = hiss(rate, 42, ['band', 4979, 0.402], 2.802, 13.41, 16000);
			return {
				seconds: 0.77,
				sample: (t: number) => tom(t) * 0.5889 * decay(t, 16.03) + low(t) * 0.2524 * decay(t, 11.17)
					+ sub(t) + brush(t) + body(t),
			};
		})(),
		'drum-hitfinish': (() => {
			// a deep boom falling to 80 Hz
			const boom = sweptSine(rate, 216.5, 80.57, 28.99);
			const octave = sweptSine(rate, 433, 161.1, 28.99);
			const click = hiss(rate, 51, ['band', 1355, 0.412], 1.401, 17.24);
			const air = hiss(rate, 52, ['high', 1280, 0.7], 0.2385, 21.48);
			return {
				seconds: 0.96,
				sample: (t: number) => boom(t) * decay(t, 11.1) + octave(t) * 0.1865 * decay(t, 17.53)
					+ click(t) + air(t),
			};
		})(),
		'drum-hitclap': (() => {
			const crack = hiss(rate, 61, ['band', 4447, 1.612], 0.06522, 353.8);
			const body = sweptSine(rate, 374.7, 96.23, 44.33);
			const octave = sweptSine(rate, 749.4, 192.5, 44.33);
			const air = hiss(rate, 62, ['band', 4094, 1], 0.8502, 26.25);
			return {
				seconds: 0.75,
				sample: (t: number) => crack(t) + body(t) * 0.8967 * decay(t, 13.46)
					+ octave(t) * 0.1419 * decay(t, 21.37) + air(t),
			};
		})(),
	};
};

/** One default hitsound at `rate` Hz: mono, peaking near full scale. */
export const renderHitsound = (
	set: SampleSetName,
	sound: HitSoundName,
	rate: number,
): Float32Array => {
	const voice = voices(rate)[`${set}-${sound}`];
	const out = new Float32Array(Math.round(voice.seconds * rate));
	let peak = 0;
	for (let i = 0; i < out.length; i++) {
		out[i] = voice.sample(i / rate);
		peak = Math.max(peak, Math.abs(out[i]));
	}
	// a short fade at the end so nothing clicks off
	const fade = Math.round(rate * 0.01);
	for (let i = 0; i < out.length; i++) {
		const tail = Math.min(1, (out.length - i) / fade);
		out[i] = out[i] / (peak || 1) * 0.89 * tail;
	}
	return out;
};
