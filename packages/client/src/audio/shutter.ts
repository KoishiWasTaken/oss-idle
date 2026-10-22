import { audioContext } from './audioContext';
import { effects } from './EffectPlayer';

const noise = (seconds: number): AudioBuffer => {
	const rate = audioContext.sampleRate;
	const buffer = audioContext.createBuffer(1, Math.ceil(rate * seconds), rate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
};

/** One mechanical click: a short burst of filtered noise. */
const click = (at: number, pitch: number, level: number) => {
	const source = audioContext.createBufferSource();
	source.buffer = noise(0.05);
	const filter = audioContext.createBiquadFilter();
	filter.type = 'bandpass';
	filter.frequency.value = pitch;
	filter.Q.value = 1.2;
	const gain = audioContext.createGain();
	gain.gain.setValueAtTime(level, at);
	gain.gain.exponentialRampToValueAtTime(0.001, at + 0.045);
	source.connect(filter).connect(gain).connect(effects.output);
	source.start(at);
};

/** A camera shutter: the curtain opens, then snaps shut. On the effects volume. */
export const playShutter = () => {
	const now = audioContext.currentTime;
	click(now, 3200, 0.9);
	click(now + 0.07, 1800, 1);
};
