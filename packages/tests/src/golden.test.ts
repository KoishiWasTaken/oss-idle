import '@oss-idle/shared/osu/controlPointPatch';

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';

import CharacterBot from '@oss-idle/shared/rulesets/mania/4k/bots/character';
import { modXp } from '@oss-idle/shared/rulesets/mania/4k/modXp';
import { makeOrderedSkills } from '@oss-idle/shared/rulesets/mania/4k/skills/factory';
import { ManiaGame } from '@oss-idle/shared/rulesets/mania/maniaGame';
import { xpScore } from '@oss-idle/shared/rulesets/mania/xpScore';

import {
	CHARTS,
	loadBeatmap,
} from './balancing/charts';

/**
 * 4K plays, seeded, pinned to a snapshot: moving 4K into its ruleset must leave
 * every score, judgement, timing and xp unchanged. Needs the charts in
 * src/.charts-cache (fetched from prod once, then frozen there).
 */

const MAPS = ['2-redline', '4-blu', 's-singularity', 'slow-stress'] as const;
const LEVELS = [20, 60, 120];
const VARIANTS = {
	plain: {},
	hr: { mods: ['HR' as const] },
	ez: { mods: ['EZ' as const] },
	rate: { rate: 1.2 },
	divine: { divine: true },
};

const mulberry32 = (seed: number) => () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const fnv = (values: Iterable<unknown>) => {
	let h = 0x811c9dc5;
	for (const v of values) for (const c of String(v)) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
	return (h >>> 0).toString(16);
};

describe('golden mania4k plays', () => {
	beforeEach(() => void vi.spyOn(Math, 'random').mockImplementation(mulberry32(1)));
	afterEach(() => void vi.restoreAllMocks());

	const cases = MAPS.flatMap(map => LEVELS.flatMap(level =>
		Object.entries(VARIANTS).map(([variant, options]) => ({
			map, level, variant, options, 
		}))));
	for (const { map, level, variant, options } of cases) {
		it(`${map} L${level} ${variant}`, async () => {
			const chart = await loadBeatmap(CHARTS[map]);
			const skills = makeOrderedSkills(level);
			const bot = new CharacterBot(skills);
			const game = new ManiaGame(chart, bot, options);
			game.update(game.songEndMs + 1000);
			const mods = 'mods' in options ? options.mods : [];
			const xp = modXp(bot.getSkillsXP(chart.totalLength, xpScore(chart, game, options)), mods);
			const { score } = game;
			expect({
				score: score.score,
				accuracy: score.accuracy,
				grade: score.grade,
				maxCombo: score.maxCombo,
				counts: score.counts,
				failed: score.failed,
				xp,
				hits: fnv(game.hits.flatMap(h => [h.time, h.offset, h.judgement, h.hp])),
				timings: fnv(game.timings),
				replay: fnv(game.replayOffsets().flatMap(r => [r.id, r.tail, r.offset])),
			}).toMatchSnapshot();
		});
	}
});
