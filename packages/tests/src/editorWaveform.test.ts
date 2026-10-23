import {
	describe,
	expect,
	it,
} from 'vitest';
import { peaksOf } from '@oss-idle/client/editor/songVisuals';

describe('the waveform', () => {
	it('keeps time with the song at a sample rate that is no whole number a millisecond', () => {
		const rate = 44_100;
		const pcm = new Float32Array(rate * 301);
		pcm[rate * 300] = 1;
		const peaks = peaksOf(pcm, rate);
		expect(peaks.indexOf(1)).toBe(300_000);
	});
});
