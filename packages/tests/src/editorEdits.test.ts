import {
	describe,
	it,
	expect,
} from 'vitest';
import type { Note } from '@oss-idle/shared/editor/chart';
import {
	fitting,
	flipped,
	notesIn,
	resnapped,
	shifted,
} from '@oss-idle/shared/editor/edits';

const note = (time: number, column: number, end?: number): Note => ({
	time, column, end, hitSound: '0', sample: '0:0:0:0:',
});

const timing = [{
	time: 0, beatLength: 400, meter: 4, 
}];

describe('editor edits', () => {
	it('keeps only the notes that overlap nothing', () => {
		const rest = [note(0, 0, 400)];
		expect(fitting([note(200, 0), note(200, 1), note(200, 1), note(500, 0)], rest))
			.toEqual([note(200, 1), note(500, 0)]);
	});

	it('shifts heads and tails together, and flips columns', () => {
		expect(shifted([note(100, 0, 300)], 50, 2)).toEqual([note(150, 2, 350)]);
		expect(flipped([note(0, 0), note(0, 3)], 4).map(n => n.column)).toEqual([3, 0]);
	});

	it('resnaps heads and tails, and collapses a long note too short to keep', () => {
		expect(resnapped([note(95, 0, 290), note(110, 1, 130)], timing, [4]))
			.toEqual([note(100, 0, 300), note(100, 1)]);
	});

	it('finds the notes a box touches', () => {
		const notes = [note(0, 0, 1000), note(500, 1), note(500, 3), note(2000, 1)];
		expect(notesIn(notes, 400, 600, 0, 2)).toEqual([notes[0], notes[1]]);
	});
});
