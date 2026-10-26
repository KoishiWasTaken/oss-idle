import '../upgrades/ladder.css';

import { Trans } from '@lingui/react/macro';

import { PRESTIGE_MIN_LEVEL } from '@oss-idle/shared/upgrades';

import type Character from '../../db/schema/character';
import PrestigeRow from './PrestigeRow';
import PrestigeSummary from './PrestigeSummary';

export default function PrestigeView({ character }: { character: Character }) {
	const locked = character.id === 0;

	return (
		<div className="ladder">
			<PrestigeSummary skills={character.skills} locked={locked} />
			<div className="ladder__list">
				{character.skills.map(skill => (
					<PrestigeRow
						key={`${character.id}:${skill.name}`}
						skill={skill}
						locked={locked}
						lifetimeXp={character.lifetimeXp(skill.name)}
					/>
				))}
			</div>
			<p className="ladder__hint">
				<Trans>
					Reaching XP Lv{PRESTIGE_MIN_LEVEL} on a skill lets you reset it. You
					lose its upgrades and Overdrive, and gain a bonus level, an
					extra gear slot and a multiplicative XP bonus. Each prestige asks for
					one more level than the last.
				</Trans>
			</p>
		</div>
	);
}
