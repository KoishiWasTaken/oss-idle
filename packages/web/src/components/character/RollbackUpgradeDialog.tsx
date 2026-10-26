import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { ph } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import useAsync from '@oss-idle/shared/hooks/useAsync';
import { revertUpgrade } from '@oss-idle/shared/upgrades';

import {
	getCharacter,
	rollbackUpgrade,
} from '../../api/characters';
import { rulesetDef } from '../../rulesets';
import ConfirmDialog from './ConfirmDialog';

/** Admin: undo a skill's last upgrade, for a player who bought one by mistake. */
export default function RollbackUpgradeDialog({ characterId, name, onDone, onClose }: {
	characterId: number;
	name: string;
	onDone: () => void;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const character = useAsync(() => getCharacter(characterId), [characterId]);
	const [skill, setSkill] = useState<string>();
	const [anchor, setAnchor] = useState<number>();

	const state = (s: string) => {
		const skill = character?.profile.skills[s];
		return skill && {
			level: skill.level,
			xp: skill.xp,
			upgrades: skill.upgrades,
			overdrive: skill.overdrive,
			prestige: skill.prestige,
		};
	};
	const upgraded = rulesetDef().skills.filter(s => (state(s)?.upgrades ?? 0) > 0);
	const now = skill && state(skill);
	const prev = now && anchor !== undefined && revertUpgrade(now, anchor);

	const pickSkill = (s: string) => {
		setSkill(s);
		setAnchor(state(s)?.level);
	};

	const send = async () => {
		if (skill && anchor !== undefined) await rollbackUpgrade(characterId, skill, anchor);
	};

	return <ConfirmDialog
		icon={faRotateLeft}
		title={t`Roll back an upgrade of ${ph({ name })}?`}
		sendLabel={t`Roll back`}
		canSend={!!prev}
		send={send}
		onDone={onDone}
		onClose={onClose}
	>
		<div className='report-dialog__lengths'>
			{upgraded.map(s => <button
				key={s}
				type='button'
				className={s === skill ? 'current' : undefined}
				onClick={() => pickSkill(s)}
			>{rulesetDef().skillName(s)}</button>)}
		</div>
		{now && <>
			<div className='report-dialog__label'>{t`XP level right after the upgrade was bought`}</div>
			<input
				type='number'
				min={0}
				max={now.level}
				value={anchor ?? ''}
				onChange={e => setAnchor(e.target.value === ''
					? undefined
					: Math.min(now.level, Math.max(0, Math.floor(Number(e.target.value)))))}
			/>
		</>}
		{skill && now && prev && <div className='report-dialog__label'>
			{rulesetDef().upgradeLabel(skill, now.upgrades)} → {rulesetDef().upgradeLabel(skill, prev.upgrades)}
			{' · '}
			{t`XP Lv${ph({ level: now.level })} → XP Lv${ph({ nextLevel: prev.level })}`}
		</div>}
	</ConfirmDialog>;
}
