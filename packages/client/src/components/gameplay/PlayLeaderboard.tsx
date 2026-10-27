import '../multiplayer/Multiplayer.css';

import {
	type CSSProperties,
	useEffect,
	useMemo,
	useState,
} from 'react';

import Entities from '../../entity/entities';
import type { BoardRow } from '../../online/services/scores';
import PlayBoardCard from './PlayBoardCard';

export type LivePlay = { score: number, combo: number, failed: boolean };

/** cards at once: the board's best and the live play, which takes the last one, with
 *  its real place, while it is below them */
const SHOWN = 6;

/** osu!'s in-game leaderboard for a solo play: the board song select had selected, the
 *  live play climbing through it. Standings tick once a second, like a match's. */
export default function PlayLeaderboard({ rows, live }: {
	rows: readonly BoardRow[],
	live: () => LivePlay,
}) {
	const [now, setNow] = useState(live);
	useEffect(() => {
		const timer = setInterval(() => setNow(live()), 1000);
		return () => clearInterval(timer);
	}, [live]);
	const me = Entities.character.get().id;
	const self = useMemo(() => ({ characterId: me }), [me]);

	// a tie stays ahead: the play has to beat it
	const place = rows.filter(r => r.score.score >= now.score).length;
	const others = rows.slice(0, SHOWN - 1);
	const selfRow = Math.min(place, SHOWN - 1);
	return (
		<div className="mp-scoreboard" style={{ '--rows': others.length + 1 } as CSSProperties}>
			{others.map(({ score, player }, i) => {
				const row = i < place ? i : i + 1;
				return (
					<div
						key={score.id}
						className="mp-scoreboard__slot"
						style={{
							'--row': row, zIndex: SHOWN - row,
						} as CSSProperties}
					>
						<PlayBoardCard
							score={score}
							player={player}
							position={row + 1}
							failed={false}
							self={false}
						/>
					</div>
				);
			})}
			<div
				className="mp-scoreboard__slot"
				style={{
					'--row': selfRow, zIndex: SHOWN + 1,
				} as CSSProperties}
			>
				<PlayBoardCard
					score={self}
					live={now}
					position={place + 1}
					failed={now.failed}
					self
				/>
			</div>
		</div>
	);
}
