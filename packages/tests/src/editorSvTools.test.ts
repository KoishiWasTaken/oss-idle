import {
	describe,
	expect,
	it,
} from 'vitest';

import {
	multiplierOf,
	scrollBeatLength,
	type TimingPoint,
} from '@oss-idle/shared/rulesets/mania/editor/chart';

import {
	constantScroll,
	linearScroll,
	scaleScroll,
	speedAt,
} from '@oss-idle/client/editor/svTools';

const sv = (time: number, multiplier: number): TimingPoint => ({
	time, beatLength: scrollBeatLength(multiplier), meter: 4, sound: '0,0,100', effects: '0',
});

/** [time, multiplier] pairs, rounded for comparison. */
const read = (scroll: TimingPoint[]) =>
	scroll.map(point => [point.time, Math.round(multiplierOf(point) * 1000) / 1000]);

const timing = [{
	time: 0, beatLength: 400, meter: 4, sound: '0,0,100', effects: '0', 
}];

describe('editor SV tools', () => {
	it('reads the speed in effect, 1 before any point', () => {
		const scroll = [sv(1000, 2)];
		expect(speedAt(scroll, 500)).toBe(1);
		expect(speedAt(scroll, 1500)).toBe(2);
	});

	it('ramps linearly on the beat lines, replacing what was there', () => {
		const scroll = [sv(0, 1), sv(500, 3), sv(2000, 1.5)];
		expect(read(linearScroll(scroll, timing, 1, {
			from: 400, to: 1200, 
		}, 1, 2))).toEqual([
			[0, 1], [400, 1], [800, 1.5], [1200, 2], [2000, 1.5],
		]);
	});

	it('sets one speed over a range, then restores the one after it', () => {
		const scroll = [sv(0, 2), sv(600, 0.5)];
		expect(read(constantScroll(scroll, {
			from: 400, to: 800, 
		}, 1))).toEqual([
			[0, 2], [400, 1], [800, 0.5],
		]);
	});

	it('scales a range, starting with the speed already in effect', () => {
		const scroll = [sv(0, 2), sv(600, 0.5), sv(1000, 1)];
		expect(read(scaleScroll(scroll, {
			from: 400, to: 800, 
		}, 2))).toEqual([
			[0, 2], [400, 4], [600, 1], [800, 0.5], [1000, 1],
		]);
	});
});
