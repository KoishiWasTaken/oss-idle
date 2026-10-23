/**
 * Speed audio up or down without changing its pitch (WSOLA, as SoundTouch does).
 *
 * The input is cut into overlapping pieces. Each piece is taken a little ahead of
 * or behind where the speed alone would put it, at the spot that lines up best
 * with the end of the previous one, then cross-faded into it. Lining the waves up
 * is what keeps it from sounding phasey or clicky.
 */

const SEQUENCE_MS = 82;
const OVERLAP_MS = 12;
const SEEK_MS = 28;
/** coarse step of the search before refining around the best match */
const SEEK_STEP = 4;

/** Mono mix, only used to find where pieces line up. */
const mixDown = (channels: Float32Array[]): Float32Array => {
	if (channels.length === 1) return channels[0];
	const mono = new Float32Array(channels[0].length);
	for (const ch of channels) for (let i = 0; i < mono.length; i++) mono[i] += ch[i] / channels.length;
	return mono;
};

/** How well the input at `at` matches the overlap kept from the last piece. */
const similarity = (mono: Float32Array, at: number, tail: Float32Array): number => {
	let dot = 0;
	let energy = 1e-9;
	for (let i = 0; i < tail.length; i += 2) {
		const v = mono[at + i];
		dot += v * tail[i];
		energy += v * v;
	}
	return dot / Math.sqrt(energy);
};

const bestOffset = (mono: Float32Array, from: number, seek: number, tail: Float32Array): number => {
	// silence matches everywhere: start at the centre so ties stay on time
	let best = seek >> 1;
	let bestScore = similarity(mono, from + best, tail);
	for (let k = 0; k < seek; k += SEEK_STEP) {
		const score = similarity(mono, from + k, tail);
		if (score > bestScore) [best, bestScore] = [k, score];
	}
	const coarse = best;
	for (let k = Math.max(0, coarse - SEEK_STEP + 1); k < Math.min(seek, coarse + SEEK_STEP); k++) {
		const score = similarity(mono, from + k, tail);
		if (score > bestScore) [best, bestScore] = [k, score];
	}
	return best;
};

/**
 * WSOLA a piece at a time, from any point of the track: the live stretcher (an audio
 * worklet) asks for pieces as it plays, the whole-track stretch for all of them. Its
 * buffers are made once; a piece allocates nothing.
 */
export class WsolaStream {

	public readonly hop: number;
	private readonly sequence: number;
	private readonly overlap: number;
	private readonly seek: number;
	private readonly mono: Float32Array;
	private readonly tails: Float32Array[];
	private readonly monoTail: Float32Array;
	private nominal = 0;
	private rate = 1;

	constructor(private readonly channels: Float32Array[], sampleRate: number) {
		this.sequence = Math.round(SEQUENCE_MS * sampleRate / 1000);
		this.overlap = Math.round(OVERLAP_MS * sampleRate / 1000);
		this.seek = Math.round(SEEK_MS * sampleRate / 1000);
		this.hop = this.sequence - this.overlap;
		this.mono = mixDown(channels);
		this.tails = channels.map(() => new Float32Array(this.overlap));
		this.monoTail = new Float32Array(this.overlap);
	}

	/** Play from sample `at`, `rate` times faster. */
	public start(at: number, rate: number): void {
		this.rate = rate;
		// a piece is copied at 1x, so read it from where its middle belongs, and
		// centre the search on that, or the output drifts ahead (worst slowed down)
		this.nominal = at + (rate - 1) * this.hop / 2 - this.seek / 2;
		const from = Math.max(0, Math.min(at, this.mono.length - this.overlap));
		this.channels.forEach((ch, c) => this.tails[c].set(ch.subarray(from, from + this.overlap)));
		this.monoTail.set(this.mono.subarray(from, from + this.overlap));
	}

	/** Write the next `hop` samples of each channel into `out` at `offset`; false at the
	 *  track's end (nothing written). */
	public next(out: Float32Array[], offset: number): boolean {
		const { channels, overlap, hop } = this;
		if (this.nominal + this.seek + this.sequence >= this.mono.length) return false;
		const from = Math.max(0, Math.floor(this.nominal));
		const start = from + bestOffset(this.mono, from, this.seek, this.monoTail);
		for (let c = 0; c < channels.length; c++) {
			const ch = channels[c];
			const o = out[c];
			const tail = this.tails[c];
			for (let i = 0; i < overlap; i++) {
				const fade = i / overlap;
				o[offset + i] = tail[i] * (1 - fade) + ch[start + i] * fade;
			}
			for (let i = overlap; i < hop; i++) o[offset + i] = ch[start + i];
			for (let i = 0; i < overlap; i++) tail[i] = ch[start + hop + i];
		}
		for (let i = 0; i < overlap; i++) this.monoTail[i] = this.mono[start + hop + i];
		this.nominal += this.rate * hop;
		return true;
	}

}

/** `channels` played `rate` times faster, same pitch. */
export const timeStretch = (
	channels: Float32Array<ArrayBuffer>[], sampleRate: number, rate: number,
): Float32Array<ArrayBuffer>[] => {
	if (rate === 1) return channels;
	const stream = new WsolaStream(channels, sampleRate);
	const length = Math.ceil(channels[0].length / rate) + stream.hop * 2;
	const out = channels.map(() => new Float32Array(length));
	stream.start(0, rate);
	let written = 0;
	while (stream.next(out, written)) written += stream.hop;
	return out.map(o => o.subarray(0, written));
};
