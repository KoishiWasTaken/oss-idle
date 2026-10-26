import useAsync from '@oss-idle/shared/hooks/useAsync';
import { ScoreDTO } from '@oss-idle/shared/score';

import Character from '../../db/schema/character';
import { Score } from '../../db/schema/score';
import { getCharacter } from '../../online/services/characters';
import type { BoardPlayer } from '../../online/services/scores';
import { getUser } from '../../online/services/users';

/**
 * Who set a score: the leaderboard's player when it says, else the character
 * (local or online) and its user (none for a guest), fetched. `loaded` once the
 * character is known.
 */
export default function useScorePlayer(score: Score | ScoreDTO, player?: BoardPlayer) {
	const fetched = useAsync(async () => {
		if (player) return undefined;
		return Character.isLocalId(score.characterId)
			? await Character.get({ id: score.characterId })
			: await getCharacter(score.characterId);
	}, [score, player]);
	const character = player ?? fetched;

	const user = useAsync(async () => !player && character && 'userId' in character
		? getUser(character.userId)
		: undefined,
	[character]);

	return {
		character, user, loaded: !!character,
	};
}
