import {
	Plural,
	Trans,
} from '@lingui/react/macro';
import { overdriveText } from '@oss-idle/shared/display/overdrive';
import PrestigeDiamonds from '../character/PrestigeDiamonds';
import SkillChip from './SkillChip';
import {
	type SkillStats,
	x,
} from './skillStats';

/** The XP multiplier written out: upgrades x overdrive → boost, x prestige x medals = total.
 *  A part that changes nothing is dimmed. */
export default function SkillEquation({ s }: { s: SkillStats }) {
	const { upgrades, max, medals } = s;
	const od = overdriveText(s.overdrive);
	const held = medals?.held ?? 0;

	return (
		<div className="skill-eq">
			<SkillChip
				label={<Trans>{upgrades}/{max} upgrades</Trans>}
				value={`+${s.upgradePercent}%`}
				base={upgrades === 0}
			/>
			<span className="skill-eq__op">x</span>
			<SkillChip
				label={<Trans>overdrive {od}</Trans>}
				value={x(s.overdriveBoost)}
				base={s.overdriveBoost === 1}
				kind="is-pink"
			/>
			<span className="skill-eq__op">→</span>
			<SkillChip
				label={<Trans>upgrade boost</Trans>}
				value={x(s.upgradeBoost)}
				base={s.upgradeBoost === 1}
			/>
			<span className="skill-eq__op">x</span>
			<SkillChip
				label={<PrestigeDiamonds prestige={s.prestige} />}
				value={x(s.prestigeBoost)}
				base={s.prestige === 0}
			/>
			{medals && <>
				<span className="skill-eq__op">x</span>
				<SkillChip
					label={<Plural value={held} one="# medal" other="# medals" />}
					value={x(medals.multiplier)}
					base={medals.multiplier === 1}
				/>
			</>}
			<span className="skill-eq__op">=</span>
			<SkillChip label={<Trans>XP</Trans>} value={x(s.total)} kind="is-total" />
		</div>
	);
}
