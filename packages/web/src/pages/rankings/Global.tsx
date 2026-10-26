import { useNavigate } from '@tanstack/react-router';

import type { getGlobalRanking } from '../../api/rankings';
import CountryFilter from '../../components/leaderboard/CountryFilter';
import PlayerLeaderboard, { type ScoreSort } from '../../components/leaderboard/PlayerLeaderboard';
import RankingsNav from './RankingsNav';

type Players = Awaited<ReturnType<typeof getGlobalRanking>>;

/** The global rankings, by performance or by ranked score. */
export default function GlobalRankings({ sort, page, country, players }: {
	sort: ScoreSort,
	page: number,
	country?: string,
	players: Players,
}) {
	const navigate = useNavigate();
	return (
		<main>
			<RankingsNav current={'global'} />
			<CountryFilter selected={country} onSelect={value => navigate({
				to: sort === 'pp' ? '/rankings/global' : '/rankings/score', search: prev => ({
					...prev, country: value || undefined, page: 1,
				}),
			})} />

			<div className='page-contents'>
				<PlayerLeaderboard sort={sort} country={country} page={page} players={players} />
			</div>
		</main>
	);
}
