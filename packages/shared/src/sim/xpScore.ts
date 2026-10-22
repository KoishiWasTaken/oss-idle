import type { Beatmap } from 'osu-classes';
import {
	ManiaGame,
	type ManiaGameOptions,
} from './maniaGame.js';
import ReplayBot from './bots/replay.js';
import type { ScoreState } from './scoring.js';
import { windowScale } from '../mods.js';

/** The score xp reads: the same hits judged at the map's own windows, so a play
 *  that is still good under HR earns, and EZ's leniency earns nothing. */
export const xpScore = (chart: Beatmap, game: ManiaGame, options: ManiaGameOptions): ScoreState => {
	if (windowScale(options.mods ?? []) === 1) return game.score;
	const plain = new ManiaGame(chart, new ReplayBot(game.replayOffsets()), {
		...options, mods: [], noFail: true,
	});
	plain.update(plain.songEndMs + 1000);
	return plain.score;
};
