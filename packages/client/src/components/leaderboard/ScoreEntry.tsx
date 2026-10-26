import './ScoreEntry.css';

import {
	memo,
	useState,
} from 'react';

import accuracy from '@oss-idle/shared/display/accuracy';
import { recentTimeAgo } from '@oss-idle/shared/display/ago';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { GUEST_AVATAR_URL } from '@oss-idle/shared/osu/profile';
import { ScoreDTO } from '@oss-idle/shared/score';

import Character from '../../db/schema/character';
import { Score } from '../../db/schema/score';
import Entities from '../../entity/entities';
import { getCharacter } from '../../online/services/characters';
import type { BoardPlayer } from '../../online/services/scores';
import { currentSkin } from '../../osu/skin/Skin';
import SceneManager, { SCENE } from '../../scenes/SceneManager';
import ScoreMods from './ScoreMods';
import ScoreTooltip from './ScoreTooltip';
import useScorePlayer from './useScorePlayer';

interface Props {
	score: Score | ScoreDTO,
	previous?: { score: number },
	/** Who set it, when the leaderboard already says. */
	player?: BoardPlayer,
	rank?: number,
}

type EntryCharacter = Character | Awaited<ReturnType<typeof getCharacter>> | BoardPlayer;

/** Server characters carry a resolved avatar (custom upload or osu! fallback);
 *  the local Guest has none, so fall back to the user avatar then the default.
 */
function entryAvatar(
	character: EntryCharacter | undefined, 
	userAvatarUrl: string | null | undefined,
) {
	if (character && 'avatarUrl' in character && character.avatarUrl)
		return character.avatarUrl;
	return userAvatarUrl || GUEST_AVATAR_URL;
}

function ScoreEntry({
	score, previous, rank, player,
}: Props) {
	const [skin] = useSynced(currentSkin);

	const { character, user, loaded } = useScorePlayer(score, player);

	const ago = recentTimeAgo(Date.now() - score.playedAt);

	const [hover, setHover] = useState(false);
	const [mouse, setMouse] = useState({
		x: 0, y: 0, 
	});
	const self = character?.name === Entities.character.get().name;

	return (
		<li
			key={score.id}
			className={
				`score_entry__row ${loaded ? 'loaded' : ''} ${score.pfc ? 'is-pfc' : ''}`
			}
			onClick={() => SceneManager.set(SCENE.RESULT, score)}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			onMouseMove={e => setMouse({
				x: e.clientX, y: e.clientY, 
			})}
		>
			<span 
				className="score_entry__avatar" 
				style={{ backgroundImage: `url(${entryAvatar(character, user?.avatarUrl)})` }}
			>
				{rank !== undefined && <span className="score_entry__rank">#{rank}</span>}
			</span>
			<span className="score_entry__grade">
				{skin.grade(score.grade)}
			</span>
			<span className="score_entry__main">
				<span className={
					`score_entry__name ${self ? 'score_self' : ''}`
				}>
					{character ? character.name : 'Loading...'}
				</span>
				<span className="score_entry__score">
					{`Score: ${score.score.toLocaleString()} (${score.maxCombo}x)`}
				</span>
			</span>
			<span className="score_entry__stats">
				<ScoreMods rate={score.rate} mods={score.mods} />
				<span className="score_entry__acc">
					{accuracy(score.accuracy)}
				</span>
				<span className="score_entry__diff">
					{previous && previous.score < score.score ? 
						`+${(score.score - previous.score).toLocaleString()}` 
						: '-'
					}
				</span>
			</span>

			{ago && <span className="score_entry__time">
				<img src="/new.png"/>
				{ago}
			</span>}

			{hover && <ScoreTooltip score={score} x={mouse.x} y={mouse.y} />}
		</li>
	);
}

// a score arriving on the board renders itself, not every score already there
export default memo(ScoreEntry);
