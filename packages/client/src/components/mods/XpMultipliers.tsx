import { Trans } from '@lingui/react/macro';

import type { Mod } from '@oss-idle/shared/mods';

import { selectedDef } from '../../rulesets/registry';

/** Mod select's xp line: what most skills get, then the skills that get something else. */
export default function XpMultipliers({ mods }: { mods: Mod[] }) {
	const def = selectedDef();
	const multipliers = def.modXpMultipliers(mods);
	const { skills } = def;
	const values = skills.map(s => multipliers[s]);
	const seen = (v: number) => values.filter(x => x === v).length;
	const base = values.reduce((most, v) => seen(v) > seen(most) ? v : most);
	const xp = base.toFixed(2);
	const others = skills.filter(s => multipliers[s] !== base);
	return (
		<div className="mod-select__xp">
			<Trans>XP Multiplier: {xp}x</Trans>
			{others.map(s => (
				<span key={s} className="mod-select__xp-skill">
					{selectedDef().skillName(s)} {multipliers[s].toFixed(2)}x
				</span>
			))}
		</div>
	);
}
