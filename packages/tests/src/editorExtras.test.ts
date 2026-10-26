import {
	describe,
	expect,
	it,
} from 'vitest';

import {
	type Chart,
	eachSnapLine,
	snapAt,
	type TimingPoint,
} from '@oss-idle/shared/rulesets/mania/editor/chart';
import {
	extrasFile,
	withExtras,
	writeExtras,
} from '@oss-idle/shared/rulesets/mania/editor/extras';

const point = (time: number, snap?: number): TimingPoint => ({
	time, beatLength: 600, meter: 4, sound: '1,1,100', effects: '0', ...snap ? { snap } : {},
});

describe('the .oss file', () => {
	it('keeps the sections\' beat snaps, and nothing when there are none', () => {
		const chart = {
			timing: [point(0), point(6000, 3)], scroll: [], notes: [], 
		} as unknown as Chart;
		const text = writeExtras(chart)!;
		expect(JSON.parse(text)).toEqual({
			version: 1, snaps: [{
				time: 6000, divisor: 3, 
			}], 
		});
		const read = withExtras({
			...chart, timing: [point(0), point(6000)], 
		}, text);
		expect(read.timing.map(p => p.snap)).toEqual([undefined, 3]);
		expect(writeExtras({
			...chart, timing: [point(0)], 
		})).toBeUndefined();
		expect(extrasFile('A - B (C) [Hard].osu')).toBe('A - B (C) [Hard].oss');
	});

	it('ignores a file it cannot read', () => {
		const chart = { timing: [point(0)] } as unknown as Chart;
		expect(withExtras(chart, '{nope')).toBe(chart);
		expect(withExtras(chart, JSON.stringify({
			version: 1, snaps: [{
				time: 0, divisor: 0, 
			}], 
		}))).toBe(chart);
	});
});

describe('section snaps', () => {
	it('lays each section\'s lines in its own snap, the others in the beat snap', () => {
		const timing = [point(0), point(1200, 3)];
		const lines: number[] = [];
		eachSnapLine(timing, 0, 2400, 2, time => lines.push(Math.round(time)));
		expect(lines).toEqual([0, 300, 600, 900, 1200, 1400, 1600, 1800, 2000, 2200]);
		expect(snapAt(timing, 500, 4)).toBe(4);
		expect(snapAt(timing, 1500, 4)).toBe(3);
	});
});
