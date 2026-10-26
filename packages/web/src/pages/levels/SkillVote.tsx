import {
	faEye,
	faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLingui } from '@lingui/react/macro';
import type { CSSProperties } from 'react';

import type { VoteSkill } from './skill';
import SkillVoteField from './SkillVoteField';

export default function SkillVote({
	skill, levels, mine, canVote, disabled, admin, onVote, onToggle,
}: {
	skill: VoteSkill,
	levels: number[],
	mine: number | undefined,
	canVote: boolean,
	disabled: boolean,
	admin: boolean,
	onVote: (level: number | undefined) => void,
	onToggle: () => void,
}) {
	const { t } = useLingui();

	return (<div
		className={`skill-vote ${disabled ? 'is-disabled' : ''}`}
		style={{ '--skill': skill.color } as CSSProperties}
	>
		<span className='skill-vote__name'>
			{skill.name}
			{admin && <button
				className='skill-vote__toggle'
				aria-label={disabled ? t`Turn voting on for this skill` : t`Turn voting off for this skill`}
				onClick={onToggle}
			>
				<FontAwesomeIcon icon={disabled ? faEyeSlash : faEye} />
			</button>}
		</span>
		{!disabled && <SkillVoteField
			name={skill.name}
			levels={levels}
			mine={mine}
			canVote={canVote}
			onVote={onVote}
		/>}
	</div>);
}
