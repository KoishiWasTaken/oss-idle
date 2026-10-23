import { Trans } from '@lingui/react/macro';
import { useSyncedAll } from '@oss-idle/shared/hooks/useSyncedAll';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import { medalXPMultiplier } from '@oss-idle/shared/achievements/catalogue';
import {
	EZ_XP,
	HR_ACCURACY_XP,
} from '@oss-idle/shared/mods';
import type Character from '../../db/schema/character';
import { getCharacterMedals } from '../../online/services/characters';
import SkillRow from './SkillRow';
import {
	skillStats,
	type MedalBoost,
} from './skillStats';
import '../upgrades/ladder.css';
import './skills.css';

const medalBoost = async (id: number): Promise<MedalBoost> => {
	const ids = (await getCharacterMedals(id)).held.map(m => m.id);
	return {
		held: ids.length, multiplier: medalXPMultiplier(ids), 
	};
};

export default function SkillsView({ character }: { character: Character }) {
	const online = character.id !== 0 && !character.isGuest();
	const medals = useAsync(() => online ? medalBoost(character.id) : undefined, [character.id]);
	const ez = EZ_XP;
	const hr = HR_ACCURACY_XP;

	useSyncedAll(
		() => character.skills.flatMap(s => [s.level, s.xp, s.upgrades, s.overdrive, s.prestige]),
		[character],
	);

	const stats = character.skills.map(skill => skillStats(skill, medals));
	// every bar is drawn against the biggest total; all at x1 draws nothing
	const scale = Math.log(Math.max(...stats.map(s => s.total))) || 1;

	return (
		<div className="ladder">
			<span className="skill-legend">
				<i className="is-upgrades" /><Trans>upgrades</Trans>
				<i className="is-prestige" /><Trans>prestige</Trans>
				{medals && <><i className="is-medals" /><Trans>medals</Trans></>}
			</span>
			<div className="ladder__list skill-list">
				{stats.map(s => (
					<SkillRow
						key={`${character.id}:${s.skill.name}`}
						s={s}
						scale={scale}
						lifetimeXp={character[`${s.skill.name}LifetimeXp`]}
					/>
				))}
			</div>
			<p className="ladder__hint">
				<Trans>
					On top of these, each play's XP changes depending on mods (EZ x{ez} on every
					skill, HR x{hr} on Accuracy) and drops when you replay the same map
					many times in a day due to mindblock (except Speed, Stamina, Jack Speed and Memory).
				</Trans>
			</p>
		</div>
	);
}
