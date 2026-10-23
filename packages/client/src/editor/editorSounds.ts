import { audioContext } from '../audio/audioContext';
import { effects } from '../audio/EffectPlayer';
import { SampleSchedule } from '../audio/SampleSchedule';
import { music } from '../audio/MusicPlayer';
import { Setting } from '../db/settings';
import type { SampleEvent } from '../osu/beatmap/storyboard';
import { prepareNoteSounds } from '../audio/hitsounds';
import {
	gridOf,
	type ChartDoc,
	type TimingPoint,
} from '@oss-idle/shared/editor/chart';
import { BeatmapDecoder } from 'osu-parsers';
import { noteSounds } from '@oss-idle/shared/sim/noteSounds';

/** The metronome: off, on every beat, or on every half beat too. */
export const METRONOME = ['off', 'beats', 'halves'] as const;
export type Metronome = typeof METRONOME[number];
export const metronome = new Setting<Metronome>('editor.metronome', 'off');

/** Whether the notes' hitsounds play while the song does. */
export const hitsoundsOn = new Setting('editor.hitsounds', true);

const DECODE_ONLY = {
	parseEvents: false, parseStoryboard: false, parseColours: false, parseEditor: false,
};
/** An edit's hitsounds are worked out once the edits pause for this long. */
const SETTLE_MS = 250;

/** Every note's hitsounds in `text`, as samples on the effects player. */
const hitsoundEvents = async (text: string, setId: number): Promise<SampleEvent[]> => {
	const beatmap = new BeatmapDecoder().decodeFromString(text, DECODE_ONLY);
	const notes = beatmap.hitObjects.map(object => ({
		time: object.startTime,
		sounds: noteSounds(
			object.samples, object.startTime, beatmap.controlPoints, beatmap.general.sampleSet,
		),
	}));
	const resolve = await prepareNoteSounds(setId, notes);
	return notes.flatMap(({ time, sounds }) => sounds.flatMap(sound => {
		const from = resolve(sound);
		return from ? [{
			time, key: from.key, file: '', volume: sound.volume, 
		}] : [];
	}));
};

const LOOKAHEAD_MS = 150;
const TICK_MS = 25;

const KEYS = {
	measure: 'editor:metronome-measure', beat: 'editor:metronome-beat', half: 'editor:metronome-half', 
};

/** A short decaying click at `frequency` Hz. */
const click = (frequency: number, gain: number): AudioBuffer => {
	const rate = audioContext.sampleRate;
	const buffer = audioContext.createBuffer(1, Math.round(rate * 0.06), rate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		const t = i / rate;
		data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 70) * gain;
	}
	return buffer;
};

let clicks = false;
const loadClicks = () => {
	if (clicks) return;
	clicks = true;
	effects.store(KEYS.measure, click(1760, 0.7));
	effects.store(KEYS.beat, click(1320, 0.55));
	effects.store(KEYS.half, click(1320, 0.25));
};

/** Every metronome tick up to `length`: the first beat of a bar high, the others lower. */
export const metronomeTicks = (
	timing: TimingPoint[],
	length: number,
	halves: boolean,
): SampleEvent[] => {
	const ticks: SampleEvent[] = [];
	// the beat grid's points: one there for effect (a stop, a 1 ms burst) ticks no beats
	const grid = gridOf(timing);
	grid.forEach((point, i) => {
		const until = grid[i + 1]?.time ?? length;
		const step = halves ? point.beatLength / 2 : point.beatLength;
		if (step <= 0) return;
		for (let n = 0, time = point.time; time < until; n++, time = point.time + n * step) {
			const beat = halves ? n / 2 : n;
			const key = !Number.isInteger(beat) ? KEYS.half
				: beat % point.meter === 0 ? KEYS.measure : KEYS.beat;
			ticks.push({
				time, key, file: '', volume: 1, 
			});
		}
	});
	return ticks;
};

/**
 * The editor's own sounds while the song plays - the notes' hitsounds and the
 * metronome's ticks - laid on the audio clock ahead of time by a SampleSchedule, so
 * they keep time with the track.
 */
export default class EditorSounds {

	private schedule?: SampleSchedule;
	private timer = 0;
	private built?: {
		timing: TimingPoint[], length: number, mode: Metronome, hits: SampleEvent[], on: boolean,
	};

	/** the notes' hitsounds as of the last settled edit, and the doc they came from */
	private hits: SampleEvent[] = [];
	private hitsOf?: ChartDoc;
	private settle = 0;

	constructor(private readonly clock: {
		now: () => number,
		playbackRate: number,
		length: number,
		timing: TimingPoint[],
		snapshot: Readonly<ChartDoc>,
		text: () => string,
		setId: number,
	}) {}

	/** Work the hitsounds out again once the edits pause; the old ones play meanwhile. */
	private watchEdits(): void {
		const doc = this.clock.snapshot as ChartDoc;
		if (doc === this.hitsOf) return;
		this.hitsOf = doc;
		window.clearTimeout(this.settle);
		this.settle = window.setTimeout(() => {
			this.settle = 0;
			void hitsoundEvents(this.clock.text(), this.clock.setId).then(hits => {
				if (this.hitsOf === doc) this.hits = hits;
			});
		}, this.hits.length ? SETTLE_MS : 0);
	}

	/** The song started (or jumped) while playing: schedule from where it is now. */
	public start(): void {
		this.stop();
		this.watchEdits();
		this.rebuild();
		this.schedule?.resync(this.scheduled());
		this.timer = window.setInterval(() => this.queue(), TICK_MS);
		this.queue();
	}

	/** The map's sound files changed: the notes' sounds are worked out again. */
	public reload(): void {
		this.hitsOf = undefined;
	}

	/** The song paused (or jumped): drop whatever was laid ahead. A seek keeps the
	 *  hitsounds; only an edit still waiting to be worked out is picked up again. */
	public stop(): void {
		if (this.settle) {
			window.clearTimeout(this.settle);
			this.settle = 0;
			this.hitsOf = undefined;
		}
		window.clearInterval(this.timer);
		this.timer = 0;
		effects.stopAll();
	}

	/** The song position being scheduled now: ahead of what is heard by the output's delay. */
	private scheduled(): number {
		return this.clock.now() + music.outputDelay() * this.clock.playbackRate;
	}

	/** The sounds made again when what they come from changed (picking up from now). */
	private rebuild(): void {
		const { timing, length } = this.clock;
		const mode = metronome.get();
		const on = hitsoundsOn.get();
		const hits = this.hits;
		const built = this.built;
		const same = built?.timing === timing && built.length === length && built.mode === mode
			&& built.hits === hits && built.on === on;
		if (same && this.schedule) return;
		if (mode !== 'off') loadClicks();
		this.built = {
			timing, length, mode, hits, on, 
		};
		const ticks = mode === 'off' ? [] : metronomeTicks(timing, length, mode === 'halves');
		const events = (on ? [...ticks, ...hits] : ticks).sort((a, b) => a.time - b.time);
		this.schedule = new SampleSchedule(events);
		this.schedule.resync(this.scheduled());
	}

	private queue(): void {
		this.watchEdits();
		this.rebuild();
		this.schedule?.queue(this.scheduled(), LOOKAHEAD_MS, this.clock.playbackRate);
	}

}
