// The profile page's own styles first, this file only shrinks them afterwards.
import './CharacterPage.css';
import './CharacterPreview.css';

import type {
	getCharacter,
	getCharacterStats,
} from '../../api/characters';
import { getUser } from '../../api/users';
import Flag from '../../components/Flag';
import ProfilePicture from '../../components/ProfilePicture';
import CharacterTotals from './CharacterTotals';
import CharacterFigures from './CharacterFigures';
import { SkillBar } from '../../components/character/SkillBar';
import { CharacterRanks } from '../../components/character/CharacterRanks';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import { extractSkills } from '@oss-idle/shared/osu/level';
import { SkillName } from '@oss-idle/shared/skills';
import { Trans } from '@lingui/react/macro';
import { countryName } from '@oss-idle/shared/display/country';
import { i18n } from '../../i18n';


type Character = Awaited<ReturnType<typeof getCharacter>>;
type Stats = Awaited<ReturnType<typeof getCharacterStats>>;

/**
 * The character profile, condensed for an embed.
 *
 * Built on the profile page's own bands and blocks so the information keeps the
 * same grouping: the info band, then the stats band split by its separator into
 * ranks and totals on one side and the figures on the other, then a titled block
 * for skills. What is left out is only what needs room or interaction, meaning
 * the banner, the rank graph and the score listings.
 */
export default function CharacterPreview({ character, stats }: {
	character: Character;
	stats: Stats;
}) {
	const user = useAsync(() => getUser(character.userId), [character]);
	const skills = Object.entries(extractSkills(character));

	return (
		<main className='preview'>
			<div className='character__info'>
				<ProfilePicture avatarUrl={character.avatarUrl} className='character__avatar' />
				<div className='character__meta'>
					<div className='character__meta-up'>{character.name}</div>
					{user && (
						<div className='character__meta-down'>
							<div className='character__meta-flag'><Flag country={user.country} /></div>
							<div className='character__meta-country'>
								{countryName(user.country, i18n.locale)}
							</div>
						</div>
					)}
				</div>
			</div>

			<div className='character__stats'>
				<div className='character__main_stats'>
					<CharacterRanks stats={stats} />
					<CharacterTotals stats={stats} />
				</div>

				<div className='character__stats_sep'></div>

				<CharacterFigures stats={stats} />
			</div>

			<div className='character__blocks'>
				<div className='character__block character__block-skills'>
					<div className='character__block-title'><Trans>Skills</Trans></div>
					<div className='main-skill'>
						<SkillBar
							skill={'overall' as SkillName}
							progress={{
								level: character.overallLevel, xp: character.overallXp,
								lifetimeXp: character.overallLifetimeXp,
							}}
						/>
					</div>
					<ul className='skills'>
						{skills.map(([skill, progress]) => (
							<SkillBar key={skill} skill={skill as SkillName} progress={progress} />
						))}
					</ul>
				</div>
			</div>
		</main>
	);
}
