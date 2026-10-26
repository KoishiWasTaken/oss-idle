const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ'];

/** lv30 = dan 1, lv90 = dan 10, +5 per dan after. */
const levelOfDan = (dan: number) => dan <= 10 ? 30 + (dan - 1) * 60 / 9 : 90 + (dan - 10) * 5;

export const DANS = Array.from({ length: 10 + GREEK.length }, (_, i) => ({
	name: i < 10 ? String(i + 1) : GREEK[i - 10]!,
	level: levelOfDan(i + 1),
}));

/** The dan a level reaches, undefined below dan 1. */
export const danOfLevel = (level: number) => DANS.findLast(d => d.level <= level + 0.5)?.name;

/** One hue per skill, spread around the wheel. */
export const skillColor = (index: number, count: number) =>
	`hsl(${index * 360 / count + 330}, 80%, 65%)`;

export const median = (values: readonly number[]) => {
	if (!values.length) return undefined;
	const sorted = values.toSorted((a, b) => a - b);
	const mid = sorted.length / 2;
	return sorted.length % 2 ? sorted[Math.floor(mid)]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** Where the middle half of the votes lie, once there are enough to tell. */
export const quartiles = (values: readonly number[]): [number, number] | undefined => {
	if (values.length < 4) return undefined;
	const sorted = values.toSorted((a, b) => a - b);
	return [sorted[Math.floor(sorted.length / 4)]!, sorted[Math.floor(sorted.length * 3 / 4)]!];
};

/** A map's level: the median of its skills' median votes. */
const mapLevel = (levels: Record<string, number[]>) =>
	median(Object.values(levels).flatMap(votes => median(votes) ?? []));

/** Voted maps by level, then the others in the order given. */
export const byLevel = <M extends { levels: Record<string, number[]> }>(maps: M[]) => maps
	.map(map => ({
		map, level: mapLevel(map.levels),
	}))
	.toSorted((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity) || 0)
	.map(({ map }) => map);

