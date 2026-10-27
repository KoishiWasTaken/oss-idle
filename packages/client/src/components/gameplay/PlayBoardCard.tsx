import { ScoreDTO } from '@oss-idle/shared/score';

import { Score } from '../../db/schema/score';
import Entities from '../../entity/entities';
import type { BoardPlayer } from '../../online/services/scores';
import useScorePlayer from '../leaderboard/useScorePlayer';
import MatchScoreCard from '../multiplayer/MatchScoreCard';

/** A board score, or the live play, in the solo in-game leaderboard. */
export default function PlayBoardCard({ score, player, live, position, failed, self }: {
	score: Score | ScoreDTO | { characterId: number },
	player?: BoardPlayer,
	/** the live play's score and combo, for the player's own card */
	live?: { score: number, combo: number },
	position: number,
	failed: boolean,
	self: boolean,
}) {
	const { character, avatarUrl } = useScorePlayer(score, player);
	const shown = live ?? ('score' in score
		? {
			score: score.score, combo: score.maxCombo,
		}
		: {
			score: 0, combo: 0,
		});
	return (
		<MatchScoreCard
			player={{
				name: self ? Entities.character.get().name : character?.name ?? '...', avatarUrl,
			}}
			score={shown.score}
			combo={shown.combo}
			position={position}
			failed={failed}
			self={self}
		/>
	);
}
