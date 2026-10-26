import {
	describe,
	expect,
	it,
} from 'vitest';

import type {
	ChartDoc,
	Note,
} from '@oss-idle/shared/rulesets/mania/editor/chart';
import {
	checkChart,
	type CheckInput,
} from '@oss-idle/shared/rulesets/mania/editor/checks';

const note = (time: number, column: number, end?: number): Note => ({
	time, column, end, hitSound: '0', sample: '0:0:0:0:',
});

const doc = (notes: Note[]): ChartDoc => ({
	notes,
	timing: [{
		time: 0, beatLength: 500, meter: 4, sound: '0,0,100', effects: '0', 
	}],
	scroll: [],
	metadata: {
		title: 'Song', titleUnicode: '', artist: 'Band', artistUnicode: '', creator: 'Me',
		version: 'Easy', source: '', tags: '', previewTime: 1000,
	},
});

/** A clean 40 s chart on a 60 s song, with a background. */
const input = (notes: Note[], over: Partial<CheckInput> = {}): CheckInput => ({
	doc: doc(notes),
	keys: 4,
	audioLength: 60_000,
	audio: 'song.mp3',
	background: true,
	otherVersions: ['Hard'],
	...over,
});

const clean = Array.from({ length: 81 }, (_, i) => note(i * 500, i % 4));
const checks = (i: CheckInput) => checkChart(i).map(issue => issue.check);

describe('editor map checks', () => {
	it('finds nothing wrong with a clean chart', () => {
		expect(checks(input(clean))).toEqual([]);
	});

	it('flags notes outside the song, overlapping, or off the grid', () => {
		const found = checkChart(input([
			...clean, note(-125, 0), note(500, 1, 1500), note(1000, 1), note(1003, 3), note(61_000, 2),
		]));
		expect(found.map(issue => issue.check)).toEqual(expect.arrayContaining([
			'beforeStart', 'afterAudio', 'overlap', 'unsnapped',
		]));
		expect(found.find(issue => issue.check === 'unsnapped')?.notes).toEqual([note(1003, 3)]);
	});

	it('lists errors before warnings', () => {
		const levels = checkChart(input([], { background: false })).map(issue => issue.level);
		expect(levels).toEqual([...levels].sort());
		expect(checks(input([], { background: false }))).toEqual(['noNotes', 'noBackground']);
	});

	it('warns about short long notes, full chords, long breaks and short maps', () => {
		expect(checks(input([
			note(0, 0, 40), note(500, 0), note(500, 1), note(500, 2), note(500, 3), note(40_000, 0),
		]))).toEqual(expect.arrayContaining(['shortLong', 'allColumns', 'longBreak']));
		expect(checks(input([note(0, 0), note(1000, 1)]))).toContain('tooShort');
	});

	it('checks the metadata and the files', () => {
		const empty = input(clean, {
			audio: 'song.wav', otherVersions: ['Easy'], 
		});
		empty.doc.metadata = {
			...empty.doc.metadata, artist: ' ', previewTime: -1, 
		};
		const found = checkChart(empty);
		expect(found.map(issue => issue.check)).toEqual(expect.arrayContaining([
			'emptyMetadata', 'duplicateName', 'noPreview', 'audioFormat',
		]));
		expect(found.find(issue => issue.check === 'emptyMetadata')?.fields).toEqual(['artist']);
	});
});
