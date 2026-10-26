import { __ } from '../../i18n/translate.js';

const TIERS = [
	'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
	'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
];

/** Gear past the base ladder keeps climbing its number instead of repeating a
 *  name. Continues by the ladder's own last step. */
const extrapolate = (ladder: readonly (string | number)[], level: number): number => {
	const top = ladder.length - 1;
	const last = ladder[top] as number;
	const previous = ladder[top - 1] as number;
	return last + (last - previous) * (level - top);
};

/**
 * The localized label of a gear ladder's step `level`. String entries translate by
 * key; numeric ones fill `template`. Past the base ladder a prestige adds gear tiers:
 * the final name repeats with a tier number, while numeric gear just keeps climbing.
 */
export function gearLabel(
	ladder: readonly (string | number)[],
	template: string | undefined,
	level: number,
): string {
	const top = ladder.length - 1;
	const tier = level - top;
	const value = ladder[Math.min(level, top)];

	if (typeof value === 'number') {
		const climbed = tier > 0 ? extrapolate(ladder, level) : value;
		return template
			? __(template, undefined, { value: climbed })
			: String(climbed);
	}

	const name = __(value);
	if (tier <= 0) return name;
	// the final ladder entry is itself Tier I, so the first extra slot is Tier II
	return __('{name} Tier {tier}', undefined, {
		name, tier: TIERS[tier] ?? String(tier + 1),
	});
}
