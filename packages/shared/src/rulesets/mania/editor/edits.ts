import {
	inEffect,
	type Note,
	snapTime,
	type TimingPoint,
} from './chart.js';
import {
	parseSample,
	writeSample,
} from './hitsounds.js';

const endOf = (note: Note) => note.end ?? note.time;

/** Notes overlap when they share a column and their spans touch. */
export const overlaps = (a: Note, b: Note) => a.column === b.column
	&& a.time <= endOf(b) && b.time <= endOf(a);

/** `candidates` in order, minus each one that would overlap `rest` or one kept before it. */
// ponytail: O(n·m) overlap scan; index by column if selections get into the thousands
export const fitting = (candidates: Note[], rest: Note[]): Note[] =>
	candidates.reduce<Note[]>((kept, note) =>
		rest.some(other => overlaps(note, other)) || kept.some(other => overlaps(note, other))
			? kept
			: [...kept, note], []);

export const shifted = (notes: Note[], dt: number, dc: number): Note[] => notes.map(note => ({
	...note,
	time: note.time + dt,
	end: note.end === undefined ? undefined : note.end + dt,
	column: note.column + dc,
}));

/** Mirrored across the playfield: the first column swaps with the last. */
export const flipped = (notes: Note[], keys: number): Note[] =>
	notes.map(note => ({
		...note, column: keys - 1 - note.column, 
	}));

/** `time` on the nearest line of any of `divisors`; a tie goes to the one listed first. */
const nearestLine = (timing: TimingPoint[], time: number, divisors: number[]): number =>
	divisors.map(divisor => snapTime(timing, time, divisor))
		.reduce((best, line) => (Math.abs(line - time) < Math.abs(best - time) ? line : best));

/** Heads and tails moved onto the nearest line of `divisors` (1/4 and 1/3 for [4, 3]);
 *  a long note that collapses becomes a note. */
export const resnapped = (notes: Note[], timing: TimingPoint[], divisors: number[]): Note[] =>
	notes.map(note => {
		const time = nearestLine(timing, note.time, divisors);
		const end = note.end === undefined ? undefined : nearestLine(timing, note.end, divisors);
		return {
			...note, time, end: end !== undefined && end > time ? end : undefined, 
		};
	});

/** The notes touching [from, to] in columns `first` to `last`. */
export const notesIn = (
	notes: Note[],
	from: number,
	to: number,
	first: number,
	last: number,
): Note[] => notes.filter(note => note.column >= first && note.column <= last
	&& note.time <= to && endOf(note) >= from);

/** Played backwards over their own span: the last to end starts first. */
export const reversed = (notes: Note[]): Note[] => {
	if (!notes.length) return notes;
	const from = Math.min(...notes.map(note => note.time));
	const to = Math.max(...notes.map(endOf));
	return notes.map(note => ({
		...note,
		time: from + to - endOf(note),
		end: note.end === undefined ? undefined : from + to - note.time,
	}));
};

/** Columns `a` and `b` swapped. */
export const swappedLanes = (notes: Note[], a: number, b: number): Note[] =>
	notes.map(note => ({
		...note, column: note.column === a ? b : note.column === b ? a : note.column,
	}));

/** Every long note made a note. */
export const withoutHolds = (notes: Note[]): Note[] =>
	notes.map(note => (note.end === undefined ? note : {
		...note, end: undefined,
	}));

/** Inverse's shortest hold and shortest gap, in ms. */
const MIN_HOLD = 36;
const MIN_GAP = 36;

/** The gap Inverse leaves before `next`: a quarter beat of the BPM leading into it. */
const gapBefore = (timing: TimingPoint[], next: Note): number => {
	const startsThere = timing.some(p => Math.round(p.time) === next.time);
	const point = inEffect(timing, startsThere ? next.time - 1 : next.time) ?? timing[0];
	return Math.max(Math.round((point?.beatLength ?? 500) / 4), MIN_GAP);
};

/** One column's notes (in time order) inverted: Quaver's Inverse. */
const invertedColumn = (lane: Note[], timing: TimingPoint[]): Note[] => {
	if (lane.length < 2) return lane;
	return lane.flatMap((note, i) => {
		const next = lane[i + 1];
		const last = lane[i + 2] === undefined;
		if (note.end === undefined) {
			if (!next) return [];
			const end = last === (next.end === undefined)
				? next.time : next.time - gapBefore(timing, next);
			return [{
				...note, end: end - note.time < MIN_HOLD ? undefined : end,
			}];
		}
		if (!next) return [note];
		const time = note.end;
		const end = last !== (next.end !== undefined)
			? next.time : next.time - gapBefore(timing, next);
		if (end - time < MIN_HOLD) return [];
		return [{
			...note, time, end, sample: writeSample({
				...parseSample(note.sample), file: '',
			}),
		}];
	});
};

/** The gaps between notes made into long notes and the notes into gaps, column by
 *  column (Quaver's Inverse); a column's last note goes, a last long note stays. */
export const inverted = (notes: Note[], timing: TimingPoint[], keys: number): Note[] =>
	Array.from({ length: keys }, (_, column) => invertedColumn(
		notes.filter(note => note.column === column).sort((a, b) => a.time - b.time), timing,
	)).flat();

/** Every note held until the next in its column (Quaver's Full LN). */
export const fullHolds = (notes: Note[], timing: TimingPoint[], keys: number): Note[] =>
	inverted(withoutHolds(notes), timing, keys);
