import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import {
	Skills,
	type SkillName,
} from '@oss-idle/shared/skills';
import {
	skillName,
	upgradeLabel,
} from '@oss-idle/shared/display/skills';
import { revertUpgrade } from '@oss-idle/shared/upgrades';
import {
	getCharacter,
	rollbackUpgrade,
} from '../../api/characters';
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
	const [skill, setSkill] = useState<SkillName>();
	const [anchor, setAnchor] = useState<number>();

	const state = (s: SkillName) => character && {
		level: character[`${s}Level`],
		xp: character[`${s}Xp`],
		upgrades: character[`${s}Upgrades`],
		overdrive: character[`${s}Overdrive`],
		prestige: character[`${s}Prestige`],
	};
	const upgraded = Skills.filter(s => (state(s)?.upgrades ?? 0) > 0);
	const now = skill && state(skill);
	const prev = now && anchor !== undefined && revertUpgrade(now, anchor);

	const pickSkill = (s: SkillName) => {
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
			>{skillName(s)}</button>)}
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
			{upgradeLabel(skill, now.upgrades)} → {upgradeLabel(skill, prev.upgrades)}
			{' · '}
			{t`XP Lv${ph({ level: now.level })} → XP Lv${ph({ nextLevel: prev.level })}`}
		</div>}
	</ConfirmDialog>;
}
