import '@oss-idle/shared/osu/controlPointPatch';
import {
	describe,
	expect,
	it,
} from 'vitest';
import { BeatmapDecoder } from 'osu-parsers';
import { ManiaGame } from '@oss-idle/shared/sim/maniaGame';
import { mapSampleName } from '@oss-idle/shared/sim/noteSounds';
import BasicBot from '@oss-idle/shared/sim/bots/basic';

const OSU = [
	'osu file format v14', '', '[General]', 'AudioFilename: a.mp3', 'SampleSet: Normal', 'Mode: 3', '',
	'[Metadata]', 'Title:t', 'Artist:a', 'Creator:c', 'Version:v', '',
	'[Difficulty]', 'CircleSize:4', 'OverallDifficulty:8', '',
	// soft at 60% from 1000ms (inherited line), index 0
	'[TimingPoints]', '0,500,4,1,0,100,1,0', '1000,-100,4,2,0,60,0,0', '',
	'[HitObjects]',
	// plain note before the soft point: normal, map volume 100
	'64,192,500,1,0,0:0:0:0:',
	// whistle after it: soft normal + soft whistle, at 60%
	'192,192,1500,1,2,0:0:0:0:',
	// a drum addition, custom index 2, own volume 80
	'320,192,2000,1,8,0:3:2:80:',
	// the map's own sample file
	'448,192,2500,1,0,0:0:0:70:kick.wav',
	'',
].join('\n');

describe('note sounds', () => {
	const game = new ManiaGame(new BeatmapDecoder().decodeFromString(OSU), new BasicBot());
	const at = (time: number) => game.notes.find(note => note.time === time)!.sounds;

	it('fill in the sample set, index and volume from the timing point', () => {
		expect(at(500)).toEqual([{
			set: 'normal', sound: 'hitnormal', index: 0, volume: 1, 
		}]);
		expect(at(1500)).toEqual([
			{
				set: 'soft', sound: 'hitnormal', index: 0, volume: 0.6, 
			},
			{
				set: 'soft', sound: 'hitwhistle', index: 0, volume: 0.6, 
			},
		]);
	});

	it('keep a note\'s own addition set, index and volume', () => {
		expect(at(2000)).toEqual([
			{
				set: 'soft', sound: 'hitnormal', index: 2, volume: 0.8, 
			},
			{
				set: 'drum', sound: 'hitclap', index: 2, volume: 0.8, 
			},
		]);
		expect(mapSampleName(at(2000)[1] as Parameters<typeof mapSampleName>[0])).toBe('drum-hitclap2');
	});

	it('play a map\'s own sample file instead', () => {
		const sounds = at(2500);
		expect(sounds).toEqual([{
			file: 'kick.wav', volume: 0.7, 
		}]);
		expect(game.notes.find(note => note.time === 2500)!.samples).toEqual(['kick.wav']);
	});
});
