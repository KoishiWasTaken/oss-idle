import {
	type ChartDoc,
	inEffect,
	type Note,
	snapTime,
} from './chart.js';
import { overlaps } from './edits.js';

export type CheckId =
	| 'noNotes'
	| 'noTiming'
	| 'beforeStart'
	| 'afterAudio'
	| 'overlap'
	| 'shortLong'
	| 'allColumns'
	| 'unsnapped'
	| 'longBreak'
	| 'tooShort'
	| 'noPreview'
	| 'noBackground'
	| 'audioFormat'
	| 'emptyMetadata'
	| 'duplicateName';

/** Something a check found: errors make a map unfit, warnings are worth a look. */
export type Issue = {
	check: CheckId,
	level: 'error' | 'warning',
	/** where to look first */
	time?: number,
	/** the notes it is about */
	notes?: Note[],
	/** the empty metadata fields */
	fields?: string[],
};

export type CheckInput = {
	doc: ChartDoc,
	keys: number,
	/** the song's length in ms; 0 when unknown */
	audioLength: number,
	audio: string,
	background: boolean,
	/** the names of the set's other difficulties */
	otherVersions: string[],
};

const LONGEST_BREAK = 30_000;
const SHORTEST_MAP = 30_000;
/** a note is on the grid when this close to a 1/16 or 1/12 line */
const SNAP_TOLERANCE = 2;

const endOf = (note: Note) => note.end ?? note.time;

/** An issue about `notes`, pointing at the first of them; none when there are none. */
const about = (check: CheckId, level: Issue['level'], notes: Note[]): Issue[] =>
	notes.length ? [{
		check, level, time: notes[0].time, notes, 
	}] : [];

/** `notes` in lists of the same `key`, in order. */
const groupBy = <K>(notes: Note[], key: (note: Note) => K): Map<K, Note[]> => {
	const groups = new Map<K, Note[]>();
	for (const note of notes) {
		const group = groups.get(key(note));
		if (group) group.push(note);
		else groups.set(key(note), [note]);
	}
	return groups;
};

const overlapping = (notes: Note[]): Note[] => {
	const found = new Set<Note>();
	for (const column of groupBy(notes, note => note.column).values()) {
		column.forEach((note, i) => {
			const next = column[i + 1];
			if (next && overlaps(note, next)) found.add(note).add(next);
		});
	}
	return notes.filter(note => found.has(note));
};

const shortLongs = ({ notes, timing }: ChartDoc): Note[] => notes.filter(note => {
	if (note.end === undefined) return false;
	const point = inEffect(timing, note.time) ?? timing[0];
	return note.end - note.time < (point?.beatLength ?? 500) / 8;
});

const fullChords = (notes: Note[], keys: number): Note[] => {
	return [...groupBy(notes, note => note.time).values()]
		.filter(chord => keys > 1 && chord.length >= keys).flat();
};

const unsnapped = ({ notes, timing }: ChartDoc): Note[] => {
	const onGrid = (time: number) => [16, 12].some(divisor =>
		Math.abs(snapTime(timing, time, divisor) - time) <= SNAP_TOLERANCE);
	return timing.length
		? notes.filter(note => !onGrid(note.time) || (note.end !== undefined && !onGrid(note.end)))
		: [];
};

/** The first gap longer than the longest allowed break, as the note after it. */
const longBreak = (notes: Note[]): Note[] => {
	let reached = notes[0] ? endOf(notes[0]) : 0;
	for (const note of notes.slice(1)) {
		if (note.time - reached > LONGEST_BREAK) return [note];
		reached = Math.max(reached, endOf(note));
	}
	return [];
};

const metadataIssues = (input: CheckInput): Issue[] => {
	const { metadata } = input.doc;
	const fields = (['title', 'artist', 'creator', 'version'] as const)
		.filter(field => !metadata[field].trim());
	return [
		...fields.length ? [{
			check: 'emptyMetadata' as const, level: 'error' as const, fields, 
		}] : [],
		...input.otherVersions.includes(metadata.version)
			? [{
				check: 'duplicateName' as const, level: 'error' as const, 
			}]
			: [],
		...metadata.previewTime < 0 ? [{
			check: 'noPreview' as const, level: 'warning' as const, 
		}] : [],
	];
};

const fileIssues = (input: CheckInput): Issue[] => [
	...input.background ? [] : [{
		check: 'noBackground' as const, level: 'warning' as const, 
	}],
	...input.audio && !/\.(mp3|ogg)$/i.test(input.audio)
		? [{
			check: 'audioFormat' as const, level: 'warning' as const, 
		}]
		: [],
];

/** What a chart is worth a second look for, errors first. */
export const checkChart = (input: CheckInput): Issue[] => {
	const { doc, keys, audioLength } = input;
	const notes = [...doc.notes].sort((a, b) => a.time - b.time || a.column - b.column);
	const first = notes[0];
	const last = notes.reduce((end, note) => Math.max(end, endOf(note)), 0);
	const issues: Issue[] = [
		...notes.length ? [] : [{
			check: 'noNotes' as const, level: 'error' as const, 
		}],
		...doc.timing.length ? [] : [{
			check: 'noTiming' as const, level: 'error' as const, 
		}],
		...about('beforeStart', 'error', notes.filter(note => note.time < 0)),
		...about('afterAudio', 'error', audioLength ? notes.filter(note => endOf(note) > audioLength) : []),
		...about('overlap', 'error', overlapping(notes)),
		...about('shortLong', 'warning', shortLongs({
			...doc, notes, 
		})),
		...about('allColumns', 'warning', fullChords(notes, keys)),
		...about('unsnapped', 'warning', unsnapped({
			...doc, notes, 
		})),
		...about('longBreak', 'warning', longBreak(notes)),
		...first && last - first.time < SHORTEST_MAP
			? [{
				check: 'tooShort' as const, level: 'warning' as const, 
			}]
			: [],
		...metadataIssues(input),
		...fileIssues(input),
	];
	return issues.sort((a, b) => Number(a.level === 'warning') - Number(b.level === 'warning'));
};
