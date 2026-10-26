import { Trans } from '@lingui/react/macro';

import { useSyncedAll } from '@oss-idle/shared/hooks/useSyncedAll';
import SkillState from '@oss-idle/shared/rulesets/skillState';
import {
	canUpgrade,
	maxUpgrades,
	upgradeXPMultiplier,
} from '@oss-idle/shared/upgrades';

import { selectedDef } from '../../rulesets/registry';

const tally = (skills: SkillState[], locked: boolean) => {
	const rows = skills.map(skill => {
		const state = skill.state();
		return {
			skill,
			max: maxUpgrades(state.prestige),
			upgrades: state.upgrades,
			ready: !locked && canUpgrade(state),
			boost: upgradeXPMultiplier(state.upgrades, state.overdrive),
		};
	});
	const sum = (pick: (r: typeof rows[number]) => number) =>
		rows.reduce((total, r) => total + pick(r), 0);
	return {
		owned: sum(r => r.upgrades),
		slots: sum(r => r.max),
		ready: sum(r => Number(r.ready)),
		maxed: sum(r => Number(r.upgrades >= r.max)),
		best: rows.reduce((a, b) => (b.boost > a.boost ? b : a)),
		average: sum(r => r.boost) / rows.length,
	};
};

export default function UpgradesSummary({ skills, locked }: {
	skills: SkillState[],
	locked: boolean,
}) {
	useSyncedAll(() => skills.flatMap(s => [s.level, s.upgrades, s.overdrive, s.prestige]), [skills]);

	const s = tally(skills, locked);
	const best = selectedDef().skillName(s.best.skill.name);

	return (
		<div className="ladder-sum">
			<div className="ladder-sum__stat ladder-sum__owned">
				<span className="ladder-sum__label"><Trans>Upgrades owned</Trans></span>
				<span className="ladder-sum__value">
					{s.owned}<span className="ladder-sum__of">/{s.slots}</span>
				</span>
				<span className="ladder-sum__track">
					<span style={{ transform: `scaleX(${s.owned / s.slots})` }} />
				</span>
			</div>
			<div className={`ladder-sum__stat ${s.ready > 0 ? 'is-ready' : ''}`}>
				<span className="ladder-sum__label"><Trans>Ready to buy</Trans></span>
				<span className="ladder-sum__value">{s.ready}</span>
			</div>
			<div className="ladder-sum__stat is-maxed">
				<span className="ladder-sum__label"><Trans>Maxed</Trans></span>
				<span className="ladder-sum__value">{s.maxed}</span>
			</div>
			<div className="ladder-sum__stat">
				<span className="ladder-sum__label"><Trans>Best XP boost</Trans></span>
				<span className="ladder-sum__value">
					x{s.best.boost.toFixed(2)}<span className="ladder-sum__of">{best}</span>
				</span>
			</div>
			<div className="ladder-sum__stat">
				<span className="ladder-sum__label"><Trans>Average XP boost</Trans></span>
				<span className="ladder-sum__value">x{s.average.toFixed(2)}</span>
			</div>
		</div>
	);
}
