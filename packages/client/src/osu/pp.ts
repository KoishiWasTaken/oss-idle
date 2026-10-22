import * as ppjs from 'rosu-pp-js-web';
import { Beatmap } from 'osu-classes';
import BeatmapStore from './beatmap/beatmap_store';
import rosuReady from './rosu';
import { ScoreState } from '@oss-idle/shared/sim/scoring';
import {
	modsLabel,
	type Mod,
} from '@oss-idle/shared/mods';

const calculatePP = async (
	score: ScoreState,
	beatmap: Beatmap,
	rate = 1,
	mods: readonly Mod[] = [],
): Promise<number> => {
	const osu = await BeatmapStore
		.getOsu(beatmap.metadata.beatmapSetId, beatmap.metadata.beatmapId);
	if (!osu) return 0;

	await rosuReady();
	return(new ppjs.Performance({
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
	})).calculate(new ppjs.Beatmap(osu)).pp;
};

export default calculatePP;