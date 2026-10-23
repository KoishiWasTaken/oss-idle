import {
	SampleSet,
	type ControlPointInfo,
	type HitSample,
} from 'osu-classes';

export type SampleSetName = 'normal' | 'soft' | 'drum';
export type HitSoundName = 'hitnormal' | 'hitwhistle' | 'hitfinish' | 'hitclap';

/** One sound a note plays: the map's own sample file, or a hitsound of a sample set -
 *  from the map's files when `index` names one of them, else the skin's. */
export type NoteSound =
	| { file: string, volume: number }
	| { set: SampleSetName, sound: HitSoundName, index: number, volume: number };

const SETS: Record<string, SampleSetName> = {
	Normal: 'normal', Soft: 'soft', Drum: 'drum', 
};

/** osu! looks a note's sample point up a moment after the note, so a point on it counts. */
const LENIENCY_MS = 1;

/**
 * The sounds a note plays, its samples completed from the timing point in effect: a
 * sample set left to the timing point takes the point's (or the map's), so do a custom
 * index of 0 and a volume of 0. Volumes are 0-1.
 */
export const noteSounds = (
	samples: HitSample[],
	time: number,
	controlPoints: ControlPointInfo,
	mapSet: SampleSet,
): NoteSound[] => {
	const point = controlPoints.samplePointAt(time + LENIENCY_MS);
	const fallbackSet = SETS[point.sampleSet] ?? SETS[SampleSet[mapSet]] ?? 'normal';
	return samples.map(sample => {
		const volume = (sample.volume || point.volume) / 100;
		if (sample.filename) return {
			file: sample.filename, volume, 
		};
		return {
			set: SETS[sample.sampleSet] ?? fallbackSet,
			sound: `hit${sample.hitSound.toLowerCase()}` as HitSoundName,
			index: sample.customIndex || point.customIndex,
			volume,
		};
	});
};

/** A sound's file name in a map, like soft-hitclap2 (index 1: no number); none for index 0. */
export const mapSampleName = (sound: Extract<NoteSound, { set: string }>): string | undefined =>
	sound.index >= 1 ? `${sound.set}-${sound.sound}${sound.index > 1 ? sound.index : ''}` : undefined;
