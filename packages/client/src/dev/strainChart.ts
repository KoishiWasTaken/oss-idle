import type { Beatmap } from 'osu-classes';
import { BeatmapDecoder } from 'osu-parsers';

/** A minute of 4K through each kind of pattern, twice - taps, streams, jacks, chords, LNs, a
 *  rest - so every strain sparkline gets something to show. */
export const strainChart = (): Beatmap => {
	const beat = 60000 / 170;
	const x = (c: number) => Math.floor((c + 0.5) * 128);
	const objects: string[] = [];
	const tap = (t: number, c: number) => objects.push(`${x(c)},192,${Math.round(t)},1,0,0:0:0:0:`);
	const hold = (t: number, c: number, len: number) =>
		objects.push(`${x(c)},192,${Math.round(t)},128,0,${Math.round(t + len)}:0:0:0:0:`);
	const section = 16 * beat;
	let t = 1000;
	for (let lap = 0; lap < 2; lap++) {
		for (let i = 0; i < 8; i++) tap(t + i * beat * 2, [0, 2, 1, 3][i % 4]);
		t += section;
		for (let i = 0; i < 64; i++) tap(t + i * beat / 4, [0, 1, 2, 3, 2, 1][i % 6]);
		t += section;
		for (let i = 0; i < 64; i++) tap(t + i * beat / 4, Math.floor(i / 8) % 2 ? 3 : 0);
		t += section;
		for (let i = 0; i < 32; i++) {
			tap(t + i * beat / 2, i % 2 ? 0 : 1);
			tap(t + i * beat / 2, i % 2 ? 2 : 3);
		}
		t += section;
		for (let i = 0; i < 8; i++) {
			hold(t + i * beat * 2, i % 2 ? 0 : 3, beat * 1.5);
			for (let k = 0; k < 6; k++) tap(t + i * beat * 2 + k * beat / 4, 1 + (k % 2));
		}
		t += section;
		t += section / 2;
	}
	return new BeatmapDecoder().decodeFromString(`osu file format v14

[General]
AudioFilename: none.mp3
Mode: 3

[Metadata]
Title:Strain test
Artist:oss!idle
Creator:oss!idle
Version:4K

[Difficulty]
HPDrainRate:6
CircleSize:4
OverallDifficulty:8

[TimingPoints]
1000,${beat},4,1,0,100,1,0

[HitObjects]
${objects.join('\n')}
`, { parseStoryboard: false });
};
