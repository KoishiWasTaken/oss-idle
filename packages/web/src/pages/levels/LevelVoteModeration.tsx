import { useLingui } from '@lingui/react/macro';
import {
	useCallback,
	useEffect,
	useState,
} from 'react';

import {
	listLevelVotes,
	removeVoterEverywhere,
	removeVoterVotes,
} from '../../api/levelVotes';
import LevelVoterRow from './LevelVoterRow';
import type { VoteSkill } from './skill';
import {
	type Voter,
	votersOf,
} from './voters';

/** Moderators: who voted what on a map, furthest from the medians first, with their votes removable. */
export default function LevelVoteModeration({ beatmapId, skills, onChanged }: {
	beatmapId: number,
	skills: VoteSkill[],
	onChanged: () => Promise<void> | void,
}) {
	const { t } = useLingui();
	const [voters, setVoters] = useState<Voter[]>();
	const [error, setError] = useState<string>();

	const load = useCallback(() => listLevelVotes(beatmapId)
		.then(rows => setVoters(votersOf(rows)))
		.catch((e: Error) => setError(e.message)), [beatmapId]);

	useEffect(() => { void load(); }, [load]);

	const remove = (request: Promise<unknown>) => request
		.then(() => Promise.all([load(), onChanged()]))
		.catch((e: Error) => setError(e.message));

	return (<div className='level-moderation'>
		{error && <p className='level-votes__error'>{error}</p>}
		{voters && !voters.length && <p className='level-votes__note'>
			{t`Nobody voted on this map yet.`}
		</p>}
		{voters?.map(v => <LevelVoterRow
			key={v.userId}
			voter={v}
			skills={skills}
			onRemove={() => void remove(removeVoterVotes(beatmapId, v.userId))}
			onRemoveEverywhere={() => void remove(removeVoterEverywhere(v.userId))}
		/>)}
	</div>);
}
