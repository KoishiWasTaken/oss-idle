import {
	describe,
	expect,
	it,
	vi,
} from 'vitest';

vi.mock('../../client/src/gameplay/rateStars', () => ({ starsOf: () => 5 }));

const { matchesSearch } = await import('../../client/src/osu/beatmap/beatmapSearch');

const beatmap = {
	metadata: {
		version: 'Hard', keys: 4, total_length: 90_000, 
	}, 
} as never;
const set = {
	metadata: {
		artist: 'Camellia', title: 'Ghost', creator: 'Evening', 
	}, 
} as never;

describe('status= search', () => {
	it('matches osu!\'s status words and their letters', () => {
		expect(matchesSearch(beatmap, set, 'status=loved', [], 'loved')).toBe(true);
		expect(matchesSearch(beatmap, set, 'status=l', [], 'loved')).toBe(true);
		expect(matchesSearch(beatmap, set, 'status=ranked', [], 'loved')).toBe(false);
		expect(matchesSearch(beatmap, set, 'status=r', [], 'ranked')).toBe(true);
		expect(matchesSearch(beatmap, set, 'status=approved', [], 'loved')).toBe(true);
		expect(matchesSearch(beatmap, set, 'status=a', [], 'ranked')).toBe(true);
		expect(matchesSearch(beatmap, set, 'status=a', [], 'unranked')).toBe(false);
		expect(matchesSearch(beatmap, set, 'status=graveyard', [], 'unranked')).toBe(true);
		expect(matchesSearch(beatmap, set, 'status=n', [], 'local')).toBe(true);
	});

	it('combines with the other terms', () => {
		expect(matchesSearch(beatmap, set, 'ghost status=loved', [], 'loved')).toBe(true);
		expect(matchesSearch(beatmap, set, 'other status=loved', [], 'loved')).toBe(false);
	});
});
