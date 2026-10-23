/**
 * The song drawn behind the playfield, in the playfield's worker: its waveform, and its
 * spectrogram. The audio comes once, as mono samples; the waveform's peaks are made
 * from it whole (again when its filter changes), the spectrogram a tile at a time as it
 * scrolls into view - a millisecond of rows per frame, so no frame waits on the maths.
 */

import type { Context2D } from '../gameplay/render/frame';
import { fft } from './fft';
import {
	DEFAULT_VISUALS,
	type VisualOptions,
	type WaveformFilter,
} from './visualOptions';

/** A song's waveform peak per millisecond. */
const PEAK_MS = 1;
/** How far osu! maps are timed ahead of their song file: the song's beats land this many
 *  ms after the notes (measured over 40 ranked maps, mp3 and ogg alike), so the song is drawn
 *  this much earlier to sit on them. */
// ponytail: one figure for every map; a per-map or player setting if some sit off
const MAP_AHEAD_MS = 25;
/** Spectrogram rows per tile, and its width in frequency columns. */
const TILE_ROWS = 512;
const TILE_COLUMNS = 256;
/** How long a frame may spend making spectrogram rows. */
const ROW_BUDGET_MS = 1;
/** Spectrogram tiles kept at most, and how many either side of the view survive a sweep */
const MAX_TILES = 24;
const TILES_KEPT = 4;

/** A biquad low- or high-pass (RBJ) run over `pcm`, at `frequency` Hz. */
const filtered = (
	pcm: Float32Array,
	rate: number,
	kind: 'low' | 'high',
	frequency: number,
): Float32Array => {
	const w = 2 * Math.PI * frequency / rate;
	const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
	const cos = Math.cos(w);
	const a0 = 1 + alpha;
	const b1 = (kind === 'low' ? 1 - cos : -(1 + cos)) / a0;
	const b0 = b1 / (kind === 'low' ? 2 : -2), b2 = b0;
	const a1 = -2 * cos / a0, a2 = (1 - alpha) / a0;
	const out = new Float32Array(pcm.length);
	let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
	for (let i = 0; i < pcm.length; i++) {
		const x = pcm[i];
		const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
		x2 = x1; x1 = x; y2 = y1; y1 = y;
		out[i] = y;
	}
	return out;
};

/** The loudest sample of each millisecond, scaled so the loudest of all is 1. */
export const peaksOf = (pcm: Float32Array, rate: number): Float32Array => {
	// fractional (44.1 samples a ms at 44.1 kHz): rounded, the waveform fell behind the song
	const per = rate * PEAK_MS / 1000;
	const peaks = new Float32Array(Math.ceil(pcm.length / per));
	let loudest = 0;
	for (let p = 0; p < peaks.length; p++) {
		let peak = 0;
		const end = Math.min(pcm.length, Math.floor((p + 1) * per));
		for (let i = Math.floor(p * per); i < end; i++) peak = Math.max(peak, Math.abs(pcm[i]));
		peaks[p] = peak;
		loudest = Math.max(loudest, peak);
	}
	if (loudest > 0) for (let p = 0; p < peaks.length; p++) peaks[p] /= loudest;
	return peaks;
};

/** Pixel `o` of `data` at loudness `v` (0-1): dark, through the editor's pink, to white. */
const heat = (data: Uint8ClampedArray, o: number, v: number) => {
	data[o] = v * 510;
	data[o + 1] = (v * 2 - 0.6) * 255;
	data[o + 2] = 90 + v * 165;
	data[o + 3] = v * 190;
};

/** A spectrogram tile, its rows made a few at a time until it is done. */
type Tile = { canvas: OffscreenCanvas, image: ImageData, made: number, done: boolean };

export default class SongVisuals {

	private pcm?: Float32Array;
	private rate = 44100;
	private options = DEFAULT_VISUALS;
	private peaks?: Float32Array;
	private peaksFilter?: WaveformFilter;
	private tiles = new Map<number, Tile>();
	private tilesOf?: object;

	public setSong(pcm: Float32Array, rate: number): void {
		this.pcm = pcm;
		this.rate = rate;
		this.peaks = undefined;
		this.tiles.clear();
	}

	public setOptions(options: VisualOptions): void {
		this.options = options;
	}

	/** Draw what is in view behind the field: x0 and width across, rows by `timeOfRow`. */
	public draw(
		ctx: Context2D,
		x0: number,
		width: number,
		h: number,
		view: { lineY: number, zoom: number, now: number },
	): void {
		if (!this.pcm) return;
		if (this.options.spectrogram.visible) this.drawSpectrogram(ctx, x0, width, h, view);
		if (this.options.waveform.visible) this.drawWaveform(ctx, x0, width, h, view);
	}

	private drawWaveform(
		ctx: Context2D,
		x0: number,
		width: number,
		h: number,
		{ lineY, zoom, now: songNow }: { lineY: number, zoom: number, now: number },
	): void {
		const now = songNow + MAP_AHEAD_MS;
		const { filter, brightness, colour } = this.options.waveform;
		if (!this.peaks || this.peaksFilter !== filter) {
			const pcm = filter === 'none' ? this.pcm!
				: filtered(this.pcm!, this.rate, filter, filter === 'low' ? 200 : 2500);
			this.peaks = peaksOf(pcm, this.rate);
			this.peaksFilter = filter;
		}
		const peaks = this.peaks;
		const centre = x0 + width / 2;
		ctx.globalAlpha = brightness / 100;
		ctx.fillStyle = colour;
		for (let y = 0; y < h; y++) {
			// the rows' times: later is higher up
			const from = Math.floor((now + (lineY - y - 1) / zoom) / PEAK_MS);
			const to = Math.ceil((now + (lineY - y) / zoom) / PEAK_MS);
			let peak = 0;
			for (let p = Math.max(0, from); p <= to && p < peaks.length; p++) peak = Math.max(peak, peaks[p]);
			if (peak <= 0) continue;
			const half = peak * width / 2;
			ctx.fillRect(centre - half, y, half * 2, 1);
		}
		ctx.globalAlpha = 1;
	}

	private drawSpectrogram(
		ctx: Context2D,
		x0: number,
		width: number,
		h: number,
		{ lineY, zoom, now: songNow }: { lineY: number, zoom: number, now: number },
	): void {
		const now = songNow + MAP_AHEAD_MS;
		const options = this.options.spectrogram;
		// a new options object is a change (they come whole, from the page)
		if (options !== this.tilesOf) {
			this.tilesOf = options;
			this.tiles.clear();
		}
		const hopMs = options.fftSize / 4 / this.rate * 1000;
		const tileMs = hopMs * TILE_ROWS;
		// a row is the window from its start: drawn where the window's middle is
		const centre = options.fftSize / 2 / this.rate * 1000 - hopMs / 2;
		const top = now + lineY / zoom - centre;
		const bottom = now + (lineY - h) / zoom - centre;
		const until = performance.now() + ROW_BUDGET_MS;
		for (let index = Math.max(0, Math.floor(bottom / tileMs)); index * tileMs <= top; index++) {
			let tile = this.tiles.get(index);
			if (!tile) {
				tile = {
					canvas: new OffscreenCanvas(TILE_COLUMNS, TILE_ROWS),
					image: new ImageData(TILE_COLUMNS, TILE_ROWS),
					made: 0,
					done: false,
				};
				this.tiles.set(index, tile);
			}
			if (!tile.done && performance.now() < until) this.makeRows(tile, index, until);
			if (!tile.done) continue;
			const start = index * tileMs + centre;
			const yTop = lineY - (start + tileMs - now) * zoom;
			ctx.drawImage(tile.canvas, x0, yTop, width, tileMs * zoom);
		}
		// a long song scrolled through would keep every tile (1 MB each): those far off go
		if (this.tiles.size > MAX_TILES) {
			const first = Math.floor(bottom / tileMs) - TILES_KEPT;
			const last = Math.floor(top / tileMs) + TILES_KEPT;
			for (const index of this.tiles.keys()) if (index < first || index > last) this.tiles.delete(index);
		}
	}

	/** Rows of a tile until `until` (performance.now()), the latest at the top (the field
	 *  scrolls up); once the last is made, the tile is drawn on its canvas. */
	private makeRows(tile: Tile, index: number, until: number): void {
		const { fftSize, scale, minHz, maxHz, intensity, cutoff } = this.options.spectrogram;
		const fftKey = `${fftSize}:${scale}:${minHz}:${maxHz}`;
		if (this.fftKey !== fftKey) {
			this.fftKey = fftKey;
			this.re = new Float32Array(fftSize);
			this.im = new Float32Array(fftSize);
			this.hann = new Float32Array(fftSize)
				.map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / fftSize));
			const binHz = this.rate / fftSize;
			// each column's bin, across the chosen range on the chosen scale
			this.bins = Array.from({ length: TILE_COLUMNS }, (_, c) => {
				const f = c / (TILE_COLUMNS - 1);
				const hz = scale === 'log' ? minHz * Math.pow(maxHz / minHz, f) : minHz + (maxHz - minHz) * f;
				return Math.min(fftSize / 2 - 1, Math.max(1, Math.round(hz / binHz)));
			});
		}
		const { re, im, hann, bins } = this;
		const pcm = this.pcm!;
		const hop = fftSize / 4;
		const floor = cutoff / 100;
		const gain = 0.4 + intensity / 80;
		const full = fftSize / 4;
		const data = tile.image.data;
		while (tile.made < TILE_ROWS && performance.now() < until) {
			const row = tile.made++;
			const start = Math.round((index * TILE_ROWS + row) * hop);
			for (let i = 0; i < fftSize; i++) {
				re[i] = (pcm[start + i] ?? 0) * hann[i];
				im[i] = 0;
			}
			fft(re, im);
			const y = TILE_ROWS - 1 - row;
			for (let c = 0; c < TILE_COLUMNS; c++) {
				const b = bins[c];
				// decibels under full scale (a Hann window's full-scale sine reads fftSize / 4)
				const db = 20 * Math.log10(Math.hypot(re[b], im[b]) / full + 1e-9);
				const v = Math.min(1, Math.max(0, ((db + 90) / 90 - floor) / (1 - floor)) * gain);
				heat(data, (y * TILE_COLUMNS + c) * 4, v);
			}
		}
		if (tile.made < TILE_ROWS) return;
		tile.canvas.getContext('2d')!.putImageData(tile.image, 0, 0);
		tile.done = true;
	}

	private fftKey = '';
	private re = new Float32Array(0);
	private im = new Float32Array(0);
	private hann = new Float32Array(0);
	private bins: number[] = [];

}
