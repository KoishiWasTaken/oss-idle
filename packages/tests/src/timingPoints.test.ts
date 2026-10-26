import {
	describe,
	expect,
	it,
} from 'vitest';

import { countTimingPoints } from '../../server/src/beatmaps/timingPoints';

describe('countTimingPoints', () => {
	it('splits red and green lines', () => {
		const osu = [
			'[General]', 'Mode: 3', '',
			'[TimingPoints]',
			'0,500,4,1,0,100,1,0',
			'1000,-50,4,1,0,100,0,0',
			'2000,-200,4,1,0,100,0,0',
			'3000,400,4,1,0,100,1,0', '',
			'[HitObjects]', '64,192,0,1,0,0:0:0:0:',
		].join('\r\n');
		expect(countTimingPoints(osu)).toEqual({
			bpm: 2, sv: 2, 
		});
	});

	it('falls back to the beat length sign on old lines', () => {
		expect(countTimingPoints('[TimingPoints]\n0,500,4,1,0,100\n10,-100,4,1,0,100\n')).toEqual({
			bpm: 1, sv: 1, 
		});
		expect(countTimingPoints('[General]\n')).toEqual({
			bpm: 0, sv: 0, 
		});
	});
});
