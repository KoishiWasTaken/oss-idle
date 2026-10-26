import type { TimingPoint } from '@oss-idle/shared/rulesets/mania/editor/chart';

/** Points listed before and after the one in effect, when a list is too long for all. */
const BEFORE = 2;
const AFTER = 6;

/** The points a list shows: the ones around `active` (the one in effect), or all of them
 *  when there are no more than `all`; `from` is the first one's index. */
export const pointsAround = (points: TimingPoint[], active: TimingPoint | undefined, all = 0) => {
	if (points.length <= all) return {
		from: 0, shown: points, 
	};
	const at = active ? points.indexOf(active) : -1;
	const from = Math.max(0, at - BEFORE);
	return {
		from, shown: points.slice(from, Math.max(at, 0) + AFTER), 
	};
};
