import {
	describe,
	expect,
	it,
} from 'vitest';

import {
	eachSnapLine,
	snapTime,
	stepTime,
	stepToward,
	type TimingPoint,
} from '@oss-idle/shared/rulesets/mania/editor/chart';

const point = (time: number, beatLength: number): TimingPoint => ({
	time, beatLength, meter: 4, sound: '1,1,100', effects: '0',
});

// as POSSESSION's CHALLENGE: 1 ms bursts at 60000 BPM between stops of 999999999 ms
const timing = [point(0, 500)];
for (let t = 2000; t < 6000; t += 216) timing.push(point(t, 1), point(t + 1, 999_999_999));
// and as FFT's: a stretch at 1800 BPM
timing.push(point(4100, 33.3));
timing.push(point(6000, 500));
timing.sort((a, b) => a.time - b.time);

describe('BPM points there for effect', () => {
	it('leave the beat grid carrying on at the tempo before them', () => {
		const lines: number[] = [];
		eachSnapLine(timing, 1000, 7000, 4, time => lines.push(time));
		// 1/4 of 500 ms: a line every 125 ms, 48 of them over 6 s, none at 0.25 ms apart
		expect(lines).toHaveLength(48);
		expect(lines.every((time, i) => i === 0 || time - lines[i - 1] === 125)).toBe(true);
		expect(snapTime(timing, 3010, 4)).toBe(3000);
	});

	it('are scrolled through a beat line at a time', () => {
		let time = 1875;
		const visited: number[] = [];
		for (let i = 0; i < 40; i++) visited.push(time = stepTime(timing, time, 4, 1));
		expect(visited[0]).toBe(2000);
		expect(visited.at(-1)).toBe(6875);
		for (let i = 0; i < 40; i++) time = stepTime(timing, time, 4, -1);
		expect(time).toBe(1875);
	});

	it('never hold a step on the same ms, even when every point is one', () => {
		const tiny = [point(0, 0.3)];
		expect(stepTime(tiny, 100, 4, 1)).toBeGreaterThan(100);
		expect(stepTime(tiny, 100, 4, -1)).toBeLessThan(100);
	});

	it('are stepped onto, with the notes on them, on the way to the next line', () => {
		// a note at 2100 and the burst at 2000-2001, between the 2000 and 2125 lines
		const stops = [2000, 2001, 2100];
		const forward = [stepToward(timing, stops, 1875, 4, 1)];
		while (forward.length < 4) forward.push(stepToward(timing, stops, forward.at(-1)!, 4, 1));
		expect(forward).toEqual([2000, 2001, 2100, 2125]);
		const back = [stepToward(timing, stops, 2125, 4, -1)];
		while (back.length < 4) back.push(stepToward(timing, stops, back.at(-1)!, 4, -1));
		expect(back).toEqual([2100, 2001, 2000, 1875]);
	});
});
