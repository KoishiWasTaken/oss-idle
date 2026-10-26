import {
	describe,
	expect,
	it,
} from 'vitest';

import type {
	ChartDoc,
	Note,
	TimingPoint,
} from '@oss-idle/shared/rulesets/mania/editor/chart';
import {
	fileUses,
	soundNames,
	soundNamesOf,
} from '@oss-idle/shared/rulesets/mania/editor/hitsounds';

const note = (time: number, hitSound = '0', sample = '0:0:0:0:'): Note => ({
	time, column: 0, hitSound, sample,
});
const point = (time: number, sound: string): TimingPoint => ({
	time, beatLength: 500, meter: 4, sound, effects: '0',
});

describe('soundNames', () => {
	it('names the files a note plays, the line filling in what it leaves', () => {
		expect(soundNames(note(0), {
			set: 2, index: 1, volume: 100, 
		})).toEqual(['soft-hitnormal']);
		// clap (8) in the drum set, custom index 3 on the note
		expect(soundNames(note(0, '8', '0:3:3:0:'), {
			set: 2, index: 1, volume: 100, 
		}))
			.toEqual(['soft-hitnormal3', 'drum-hitclap3']);
		expect(soundNames(note(0, '0', '1:0:0:0:kick.wav'), undefined)).toEqual(['kick.wav']);
	});

	it('takes the later of the BPM and SV lines', () => {
		const first = note(100);
		const second = note(1100, '2');
		const doc = {
			notes: [second, first],
			timing: [point(0, '1,1,100')],
			scroll: [point(1000, '2,4,100')],
		} as ChartDoc;
		const names = soundNamesOf(doc);
		expect(names.get(first)).toEqual(['normal-hitnormal']);
		expect(names.get(second)).toEqual(['soft-hitnormal4', 'soft-hitwhistle4']);
	});

	it('counts the notes playing each of the map\'s files, the default sounds none', () => {
		const files = ['soft-hitclap2.wav', 'soft-hitclap.wav', 'kick.wav'];
		const doc = {
			notes: [
				// clap in the soft set at index 2
				note(0, '8', '2:0:2:0:'),
				note(10, '0', '0:0:0:0:kick.wav'),
				// index 0 on a line of index 0: the default sounds, no file
				note(20, '8', '2:0:0:0:'),
			],
			timing: [point(0, '2,0,100')],
			scroll: [],
		} as unknown as ChartDoc;
		expect(Object.fromEntries(fileUses(doc, files)))
			.toEqual({
				'soft-hitclap2.wav': 1, 'soft-hitclap.wav': 0, 'kick.wav': 1, 
			});
	});
});
