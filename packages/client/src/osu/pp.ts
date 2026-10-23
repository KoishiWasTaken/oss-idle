import * as ppjs from 'rosu-pp-js-web';
import { Beatmap } from 'osu-classes';
import BeatmapStore from './beatmap/beatmap_store';
import rosuReady from './rosu';
import { ScoreState } from '@oss-idle/shared/sim/scoring';
import type { Mod } from '@oss-idle/shared/mods';
import { performanceArgs } from '@oss-idle/shared/osu/performanceArgs';

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
	return new ppjs.Performance(performanceArgs(score, rate, mods))
		.calculate(new ppjs.Beatmap(osu)).pp;
};

export default calculatePP;