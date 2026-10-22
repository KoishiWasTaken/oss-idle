import { Trans } from '@lingui/react/macro';
import {
	modXpMultipliers,
	type Mod,
} from '@oss-idle/shared/mods';
import { Skills } from '@oss-idle/shared/skills';
import { skillName } from '@oss-idle/shared/display/skills';

/** Mod select's xp line: what most skills get, then the skills that get something else. */
export default function XpMultipliers({ mods }: { mods: Mod[] }) {
	const multipliers = modXpMultipliers(mods);
	const values = Skills.map(s => multipliers[s]);
	const seen = (v: number) => values.filter(x => x === v).length;
	const base = values.reduce((most, v) => seen(v) > seen(most) ? v : most);
	const xp = base.toFixed(2);
	const others = Skills.filter(s => multipliers[s] !== base);
	return (
		<div className="mod-select__xp">
			<Trans>XP Multiplier: {xp}x</Trans>
			{others.map(s => (
				<span key={s} className="mod-select__xp-skill">
					{skillName(s)} {multipliers[s].toFixed(2)}x
				</span>
			))}
		</div>
	);
}
