import type { CSSProperties } from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import Entities from '../../entity/entities';
import Multiplayer from '../../online/multiplayer';
import MatchScoreCard from './MatchScoreCard';
import useLiveScores from './useLiveScores';
import usePlayers from './usePlayers';

/** The live standings on the left of the playfield, during a match play. */
export default function MatchScoreboard({ beatmapId }: { beatmapId: number }) {
	const [match] = useSynced(Multiplayer.current);
	const players = usePlayers();
	const inRound = !!match && Multiplayer.inRound(match, beatmapId);
	const scores = useLiveScores(inRound);

	if (!inRound) return null;
	const me = Entities.character.get()?.id;
	return (
		<div
			className="mp-scoreboard"
			style={{ '--rows': scores.length } as CSSProperties}
		>
			{scores.map((s, i) => (
				<div
					key={s.characterId}
					className="mp-scoreboard__slot"
					style={{
						'--row': i, zIndex: scores.length - i,
					} as CSSProperties}
				>
					<MatchScoreCard
						player={players.get(s.characterId)}
						score={s.score}
						combo={s.combo}
						position={i + 1}
						failed={s.failed}
						self={s.characterId === me}
					/>
				</div>
			))}
		</div>
	);
}
