/** How the song is drawn behind the playfield: the worker reads these, the page keeps
 *  the player's in visualSetting. */
export type WaveformFilter = 'none' | 'low' | 'high';
export type FrequencyScale = 'linear' | 'log';

/** How the field itself is drawn, as Quaver's view menu. */
export type FieldOptions = {
	/** 0-100: the background image's brightness */
	brightness: number,
	/** 0-100: the field's dark backing */
	playfield: number,
	/** 30-100: long notes' bodies and ends */
	holds: number,
	/** the beat lines coloured by their snap, or all white */
	snapColours: 'snap' | 'white',
	bookmarks: boolean,
};

export type VisualOptions = {
	field: FieldOptions,
	waveform: { visible: boolean, brightness: number, colour: string, filter: WaveformFilter },
	spectrogram: {
		visible: boolean,
		/** samples per FFT: more is finer in pitch, coarser in time */
		fftSize: number,
		scale: FrequencyScale,
		minHz: number,
		maxHz: number,
		/** 0-100: how bright the loud parts get */
		intensity: number,
		/** 0-100: how quiet a part stays dark */
		cutoff: number,
	},
};

export const DEFAULT_VISUALS: VisualOptions = {
	field: {
		brightness: 40, playfield: 100, holds: 100, snapColours: 'snap', bookmarks: true,
	},
	waveform: {
		visible: true, brightness: 35, colour: '#7ad7ff', filter: 'none',
	},
	spectrogram: {
		visible: false, fftSize: 1024, scale: 'log', minHz: 40, maxHz: 12000, intensity: 40, cutoff: 40,
	},
};

/** Stored options with anything added since filled in from the defaults. */
export const withDefaults = (options: Partial<VisualOptions>): VisualOptions => ({
	field: {
		...DEFAULT_VISUALS.field, ...options.field,
	},
	waveform: {
		...DEFAULT_VISUALS.waveform, ...options.waveform,
	},
	spectrogram: {
		...DEFAULT_VISUALS.spectrogram, ...options.spectrogram,
	},
});
