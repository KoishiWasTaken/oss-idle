import {
	inEffect,
	type ChartDoc,
	type Note,
	type TimingPoint,
} from './chart.js';

/** A note's additions, by their bit in the .osu hitSound field (normal always plays). */
export const ADDITIONS = {
	whistle: 2, finish: 4, clap: 8,
} as const;
export type Addition = keyof typeof ADDITIONS;

/** Sample sets as osu! numbers them: 0 leaves it to the timing point. */
export const SAMPLE_SET_IDS = ['auto', 'normal', 'soft', 'drum'] as const;
export type SampleSetId = typeof SAMPLE_SET_IDS[number];

/** A note's sample fields: its sets, custom index and volume (0 = the timing point's)
 *  and its own sample file (a keysound), if any. */
export type NoteSample = {
	normalSet: number,
	additionSet: number,
	index: number,
	volume: number,
	file: string,
};

const number = (value: string | undefined) => {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

export const parseSample = (sample: string): NoteSample => {
	const [normalSet, additionSet, index, volume, ...file] = sample.split(':');
	return {
		normalSet: number(normalSet),
		additionSet: number(additionSet),
		index: number(index),
		volume: number(volume),
		file: file.join(':'),
	};
};

export const writeSample = (sample: NoteSample): string =>
	`${sample.normalSet}:${sample.additionSet}:${sample.index}:${sample.volume}:${sample.file}`;

export const hasAddition = (note: Note, addition: Addition): boolean =>
	(number(note.hitSound) & ADDITIONS[addition]) !== 0;

export const withAddition = (note: Note, addition: Addition, on: boolean): Note => {
	const bits = number(note.hitSound);
	return {
		...note, hitSound: String(on ? bits | ADDITIONS[addition] : bits & ~ADDITIONS[addition]),
	};
};

export const withSample = (note: Note, patch: Partial<NoteSample>): Note => ({
	...note, sample: writeSample({
		...parseSample(note.sample), ...patch,
	}),
});

/** A timing point's sample defaults for the notes after it. */
export type PointSound = { set: number, index: number, volume: number };

export const parsePointSound = (sound: string): PointSound => {
	const [set, index, volume] = sound.split(',');
	return {
		set: number(set), index: number(index), volume: number(volume) || 100,
	};
};

export const writePointSound = (sound: PointSound): string =>
	`${sound.set},${sound.index},${sound.volume}`;

/** The point (BPM or SV) whose sample defaults a note at `time` takes: the later of the two. */
export const soundPointAt = (
	timing: TimingPoint[],
	scroll: TimingPoint[],
	time: number,
): TimingPoint | undefined => {
	const red = inEffect(timing, time);
	const green = inEffect(scroll, time);
	return !green || (red && red.time > green.time) ? red : green;
};

/** What a note plays, as osu! names the files (soft-hitclap2: a custom index above 1 is the
 *  map's own file of that name), or the note's own sample file. */
export const soundNames = (note: Note, line: PointSound | undefined): string[] => {
	const sample = parseSample(note.sample);
	if (sample.file) return [sample.file];
	const normal = sample.normalSet || line?.set || 1;
	const additions = sample.additionSet || normal;
	const index = sample.index || line?.index || 1;
	const name = (set: number, sound: string) =>
		`${SAMPLE_SET_IDS[set] ?? 'normal'}-hit${sound}${index > 1 ? index : ''}`;
	return [
		name(normal, 'normal'),
		...(Object.keys(ADDITIONS) as Addition[])
			.filter(addition => hasAddition(note, addition))
			.map(addition => name(additions, addition)),
	];
};

/** Each note with the line in effect for it, walking the notes and the points in time order once. */
const eachNoteLine = (doc: ChartDoc, visit: (note: Note, line: PointSound | undefined) => void) => {
	const notes = [...doc.notes].sort((a, b) => a.time - b.time);
	const points = [...doc.timing, ...doc.scroll].sort((a, b) => a.time - b.time);
	let at = -1;
	let line: PointSound | undefined;
	for (const note of notes) {
		let moved = false;
		while (at + 1 < points.length && points[at + 1].time <= note.time) {
			at++;
			moved = true;
		}
		if (moved) line = parsePointSound(points[at].sound);
		visit(note, line);
	}
};

/** Every note's sound names. */
export const soundNamesOf = (doc: ChartDoc): Map<Note, string[]> => {
	const names = new Map<Note, string[]>();
	eachNoteLine(doc, (note, line) => names.set(note, soundNames(note, line)));
	return names;
};

const stemOf = (file: string) => file.toLowerCase().replace(/\.[^.]+$/, '');

/** How many notes play each of the map's sound `files`: as their own sample file, or as the
 *  hitsound file their custom index names (0, the default sounds, names none). */
export const fileUses = (doc: ChartDoc, files: string[]): Map<string, number> => {
	const byName = new Map(files.map(file => [file.toLowerCase(), file]));
	const byStem = new Map(files.map(file => [stemOf(file), file]));
	const uses = new Map(files.map(file => [file, 0]));
	eachNoteLine(doc, (note, line) => {
		const sample = parseSample(note.sample);
		const used = new Set<string | undefined>();
		if (sample.file) used.add(byName.get(sample.file.toLowerCase()));
		else if (sample.index || line?.index) {
			for (const name of soundNames(note, line)) used.add(byStem.get(name));
		}
		for (const file of used) if (file) uses.set(file, uses.get(file)! + 1);
	});
	return uses;
};
