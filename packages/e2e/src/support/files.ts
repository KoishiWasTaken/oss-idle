import { execFileSync } from 'node:child_process';

import {
	strToU8,
	zipSync,
} from 'fflate';

/** A plain pink JPEG, as a map's background. */
export const jpeg = (width: number, height: number): Buffer => execFileSync('ffmpeg', [
	'-v', 'error', '-f', 'lavfi', '-i', `color=c=0xff66ab:s=${width}x${height}`,
	'-frames:v', '1', '-f', 'mjpeg', 'pipe:1',
]);

/** A silent mono WAV, as a song to map on. */
export const silence = (seconds: number): Buffer => {
	const rate = 8000;
	const bytes = rate * seconds * 2;
	const wav = Buffer.alloc(44 + bytes);
	wav.write('RIFF', 0);
	wav.writeUInt32LE(36 + bytes, 4);
	wav.write('WAVEfmt ', 8);
	wav.writeUInt32LE(16, 16);
	wav.writeUInt16LE(1, 20);
	wav.writeUInt16LE(1, 22);
	wav.writeUInt32LE(rate, 24);
	wav.writeUInt32LE(rate * 2, 28);
	wav.writeUInt16LE(2, 32);
	wav.writeUInt16LE(16, 34);
	wav.write('data', 36);
	wav.writeUInt32LE(bytes, 40);
	return wav;
};

/** A 16-bit mono WAV of `seconds` with a kick on every beat at `bpm`, the first at `first` ms. */
export const clicks = (bpm: number, first: number, seconds: number): Buffer => {
	const rate = 22050;
	const wav = silence(seconds);
	const samples = rate * seconds;
	const out = Buffer.alloc(44 + samples * 2);
	wav.copy(out, 0, 0, 44);
	out.writeUInt32LE(rate, 24);
	out.writeUInt32LE(rate * 2, 28);
	out.writeUInt32LE(36 + samples * 2, 4);
	out.writeUInt32LE(samples * 2, 40);
	for (let beat = first / 1000; beat < seconds - 0.2; beat += 60 / bpm) {
		const start = Math.round(beat * rate);
		for (let i = 0; i < rate * 0.12 && start + i < samples; i++) {
			const t = i / rate;
			const v = Math.sin(2 * Math.PI * (55 + 120 * Math.exp(-t * 35)) * t) * Math.exp(-t * 20);
			out.writeInt16LE(Math.round(v * 28000), 44 + (start + i) * 2);
		}
	}
	return out;
};

/** An .osz that passes the map checks: `count` notes half a second apart at 120 BPM, one
 *  difficulty (under 60 of them, it is shorter than the checks like, but that is a warning),
 *  by `creator`, its file naming the set `setId` (none by default). */
export const cleanOsz = (
	title: string,
	{
		count = 80, creator = 'e2e', setId = -1, background,
	}: { count?: number, creator?: string, setId?: number, background?: Buffer } = {},
): Buffer => {
	const notes = Array.from({ length: count }, (_, i) =>
		`${64 + (i % 4) * 128},192,${i * 500},1,0,0:0:0:0:`);
	return Buffer.from(zipSync({
		'map.osu': strToU8([
			'osu file format v14', '', '[General]', 'AudioFilename: song.mp3', 'PreviewTime: 1000', 'Mode: 3', '',
			'[Metadata]', `Title:${title}`, 'Artist:e2e', `Creator:${creator}`, 'Version:Normal',
			`BeatmapSetID:${setId}`, '',
			'[Difficulty]', 'CircleSize:4', '', '[Events]', '0,0,"bg.jpg",0,0', '',
			'[TimingPoints]', '0,500,4,2,0,100,1,0', '', '[HitObjects]', ...notes, '',
		].join('\r\n')),
		...background && { 'bg.jpg': new Uint8Array(background) },
	}));
};
