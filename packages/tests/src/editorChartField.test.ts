import { BeatmapDecoder } from 'osu-parsers';
import {
	describe,
	expect,
	it,
} from 'vitest';

import { Bot } from '@oss-idle/shared/rulesets/mania/bot';
import { parseChart } from '@oss-idle/shared/rulesets/mania/editor/chart';
import { ManiaGame } from '@oss-idle/shared/rulesets/mania/maniaGame';

import ChartField from '@oss-idle/client/editor/chartField';

class Autoplay extends Bot {
	pressOffset() {
		return 0;
	}
	releaseOffset() {
		return 0;
	}
}

// BPM changes, scroll speeds (two at once, one with a red line, past the clamp), a long note last
const CHART = `osu file format v14

[General]
AudioFilename: audio.mp3
Mode: 3

[Metadata]
Title:t
Artist:a
Creator:c
Version:v

[Difficulty]
CircleSize:4
OverallDifficulty:8

[TimingPoints]
0,500,4,1,0,100,1,0
1000,-50,4,1,0,100,0,0
2000,-25,4,1,0,100,0,0
2000,-400,4,1,0,100,0,0
3000,-200,4,1,0,100,0,0
4000,300,4,1,0,100,1,0
4000,-50,4,1,0,100,0,0
5000,-2000,4,1,0,100,0,0
5500,-5,4,1,0,100,0,0
6200,400,3,1,0,100,1,0

[HitObjects]
64,192,500,1,0,0:0:0:0:
192,192,1500,1,0,0:0:0:0:
320,192,1500,1,0,0:0:0:0:
448,192,3200,128,0,3900:0:0:0:0:
64,192,4600,128,0,6000:0:0:0:0:
`;

describe('ChartField', () => {
	const beatmap = new BeatmapDecoder().decodeFromString(CHART);
	const game = new ManiaGame(beatmap, new Autoplay(), { noFail: true });
	const chart = parseChart(CHART);
	const field = new ChartField(chart, chart);

	it('scrolls and draws bar lines as the game does', () => {
		for (const t of [0, 700, 1200, 2500, 3100, 3950, 4500, 5200, 5800, 6500]) {
			expect(field.scroll.positionAt(t)).toBeCloseTo(game.scroll.positionAt(t), 6);
		}
		expect(field.barlines).toEqual(game.barlines);
	});

	it('plays the notes as autoplay does', () => {
		const strip = (notes: ManiaGame['notes']) => notes.map(n => ({
			time: n.time, end: n.getEndTime(), column: n.column,
			head: n.headJudged, holding: n.holding, tail: n.tailJudged,
		}));
		for (const t of [0, 1500, 3500, 5000, 7000]) {
			game.seek(t);
			field.seek(t);
			expect(strip(field.notes)).toEqual(strip(game.notes));
		}
	});

	it('keeps its scroll while only the notes change', () => {
		const moved = new ChartField(chart, {
			...chart, notes: chart.notes.slice(1),
		}, field);
		expect(moved.scroll).toBe(field.scroll);
	});
});
