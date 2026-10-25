import { BAR_ZONES } from '@oss-idle/shared/fatigue';

export type WarmupStage = 'cold' | 'warming' | 'peak' | 'pushing' | 'fatigued';

/** which zone of the warm-up bar the character sits in */
export const warmupStage = (bar: number): WarmupStage => {
	const [peak, pushing, fatigued] = BAR_ZONES;
	if (bar < peak) return bar < peak / 2 ? 'cold' : 'warming';
	if (bar < pushing) return 'peak';
	return bar < fatigued ? 'pushing' : 'fatigued';
};
