import {
	describe,
	expect,
	it,
} from 'vitest';
import type { TimingPoint } from '@oss-idle/shared/editor/chart';
import {
	mainBeatLength,
	straysOf,
} from '@oss-idle/client/editor/timelineGraph';

const point = (time: number, beatLength: number): TimingPoint => ({
	time, beatLength, meter: 4, sound: '1,1,100', effects: '0',
});

describe('timeline ticks', () => {
	it('takes the tempo the map spends longest at as its baseline', () => {
		expect(mainBeatLength([point(0, 500), point(10_000, 250), point(12_000, 500)], 60_000)).toBe(500);
		expect(mainBeatLength([point(0, 500), point(1_000, 250)], 60_000)).toBe(250);
	});

	it('sizes a point by how far it strays, four times either way being all the way', () => {
		const points = [point(0, 500), point(30_000, 250), point(50_000, 125)];
		const timing = straysOf(points, 'timing', 60_000, 6);
		expect(Array.from(timing)).toEqual([0, -1, -1, 0.5, -1, 1]);
		// SV: 1x is the baseline, 0.5x halfway, a slice with none is -1
		const scroll = straysOf([point(0, -100), point(30_000, -200)], 'scroll', 60_000, 3);
		expect(Array.from(scroll)).toEqual([0, -1, 0.5]);
	});
});
