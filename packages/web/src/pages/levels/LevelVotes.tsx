import './LevelVotes.css';

import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import {
	useCallback,
	useEffect,
	useState,
} from 'react';

import {
	clearLevelVote,
	type LevelMap,
	listLevelMaps,
	removeLevelMap,
	updateLevelMap,
	voteLevel,
} from '../../api/levelVotes';
import Link from '../../components/Link';
import {
	useAdmin,
	useModerator,
} from '../../hooks/useAdmin';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { rulesetDef } from '../../rulesets';
import MapsNav from '../beatmaps/MapsNav';
import LevelChart from './LevelChart';
import LevelMapCard from './LevelMapCard';
import LevelMapPicker from './LevelMapPicker';
import {
	byLevel,
	skillColor,
} from './levelScale';

/** One vote changed in place, so the chart moves before the server answers. */
const withVote = (map: LevelMap, skill: string, level: number | undefined): LevelMap => {
	const levels = [...map.levels[skill] ?? []];
	const old = map.mine[skill];
	if (old !== undefined) levels.splice(levels.indexOf(old), 1);
	if (level !== undefined) levels.push(level);
	const mine = { ...map.mine };
	if (level === undefined) delete mine[skill];
	else mine[skill] = level;
	return {
		...map,
		levels: {
			...map.levels, [skill]: levels,
		},
		mine,
	};
};

/** Players vote the skill levels each listed map needs, to calibrate the level scale against dans. */
export default function LevelVotes() {
	const { t } = useLingui();
	const user = useCurrentUser();
	const admin = useAdmin();
	const moderator = useModerator();
	const def = rulesetDef();
	const [maps, setMaps] = useState<LevelMap[]>();
	const [error, setError] = useState<string>();

	const skills = def.skills.map((key, i) => ({
		key, name: def.skillName(key), color: skillColor(i, def.skills.length),
	}));

	// sorted on load only: a card never moves under its voter
	const reload = useCallback(() => listLevelMaps()
		.then(list => setMaps(byLevel(list)))
		.catch((e: Error) => setError(e.message)), []);

	useEffect(() => { void reload(); }, [reload, user?.id]);

	const act = (request: Promise<unknown>) => request
		.then(() => setError(undefined))
		.catch((e: Error) => {
			setError(e.message);
			void reload();
		});

	const vote = (beatmapId: number, skill: string, level: number | undefined) => {
		setMaps(list => list?.map(m => m.beatmapId === beatmapId ? withVote(m, skill, level) : m));
		void act(level === undefined
			? clearLevelVote(beatmapId, skill)
			: voteLevel(beatmapId, skill, level));
	};

	const toggleSkill = (map: LevelMap, skill: string) => {
		const disabled = map.disabled.includes(skill)
			? map.disabled.filter(s => s !== skill)
			: [...map.disabled, skill];
		void act(updateLevelMap(map.beatmapId, { disabled }).then(reload));
	};

	const setTarget = (beatmapId: number, target: string) =>
		void act(updateLevelMap(beatmapId, { target }).then(reload));

	const remove = (beatmapId: number) => void act(removeLevelMap(beatmapId).then(reload));

	return (<main>
		<MapsNav current='levels' />
		<div className='page-contents level-votes'>
			<p className='level-votes__intro'><Trans>
				What levels does a character need on each of these maps, for the result it asks for?
				Vote only the skills you can judge and leave the rest on ?. The chart updates with every vote.
			</Trans></p>
			<p className='level-votes__scale'><Trans>
				Scale: level 30 is about dan 1, level 90 about dan 10, then +5 levels per dan (α 95, β 100, γ 105…).
			</Trans></p>
			{!user && <p className='level-votes__note'>
				<Trans><Link to='/login'>Sign in</Link> to vote.</Trans>
			</p>}
			{error && <p className='level-votes__error'>{error}</p>}

			{maps && !!maps.length && <LevelChart maps={maps} skills={skills} />}

			{admin && <LevelMapPicker onAdded={reload} />}

			{maps && !maps.length && <p className='level-votes__note'>{t`No maps to vote on yet.`}</p>}

			<div className='level-votes__list'>
				{maps?.map(m => <LevelMapCard
					key={m.beatmapId}
					map={m}
					skills={skills}
					canVote={!!user}
					admin={admin}
					moderator={moderator}
					onVote={vote}
					onToggleSkill={skill => toggleSkill(m, skill)}
					onTarget={target => setTarget(m.beatmapId, target)}
					onRemove={() => remove(m.beatmapId)}
					onModerated={reload}
				/>)}
			</div>
		</div>
	</main>);
}
