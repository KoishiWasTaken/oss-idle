import * as ppjs from 'rosu-pp-js';
import {
	RATES,
	rateKey,
} from '@oss-idle/shared/rate';
import type { ScoreState } from '@oss-idle/shared/sim/scoring';
import type { Mod } from '@oss-idle/shared/mods';
import { performanceArgs } from '@oss-idle/shared/osu/performanceArgs';

/**
 * Performance points for a finished play, computed from the raw `.osu` chart and
 * the simulated `ScoreState`, with the node `rosu-pp-js` build (synchronous, no wasm
 * init) and the stored chart text.
 */
export function calculatePP(
	score: ScoreState,
	chart: string,
	rate = 1,
	mods: readonly Mod[] = [],
): number {
	const map = new ppjs.Beatmap(chart);
	return new ppjs.Performance(performanceArgs(score, rate, mods)).calculate(map).pp;
}

/** The chart's star rating at a playback rate. */
export const starsAt = (chart: string, rate = 1): number =>
	new ppjs.Difficulty({
		lazer: false, clockRate: rate,
	}).calculate(new ppjs.Beatmap(chart)).stars;

/** The chart's stars at every rate but x1, by `rateKey`. */
export const starsAtRates = (chart: string): Record<string, number> =>
	Object.fromEntries(RATES.map(rate => [
		rateKey(rate), Math.round(starsAt(chart, rate) * 1000) / 1000,
	]));
