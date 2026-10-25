import type { ScoreState } from '../sim/scoring.js';
import {
	modsLabel,
	type Mod,
} from '../mods.js';

/** What pp reads off a play: a live score, or a stored one. */
export type PerformanceScore = Pick<ScoreState, 'score' | 'accuracy' | 'maxCombo' | 'counts'>;

/** rosu-pp's `Performance` arguments for a play, the same for the server and the client builds. */
export const performanceArgs = (score: PerformanceScore, rate = 1, mods: readonly Mod[] = []) => ({
	lazer: false,
	clockRate: rate,
	mods: modsLabel(mods),

	legacyTotalScore: Math.floor(score.score),
	// a pure divine play reads above 1, which is outside rosu-pp's domain
	accuracy: Math.min(1, score.accuracy),
	combo: score.maxCombo,

	nGeki: score.counts.MARVELOUS + score.counts.DIVINE,
	n300: score.counts.PERFECT,
	nKatu: score.counts.GREAT,
	n100: score.counts.GOOD,
	n50: score.counts.BAD,
	misses: score.counts.MISS,
});
