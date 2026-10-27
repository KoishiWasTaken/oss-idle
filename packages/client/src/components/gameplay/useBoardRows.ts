import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';

import {
	SCORE_TAB,
	SETTINGS,
} from '../../db/settings';
import Account from '../../online/account';
import {
	type BoardRow,
	boardScores,
} from '../../online/services/scores';

const NONE: BoardRow[] = [];

/** The map's board on the tab song select had selected, while `on`; Country falls back to
 *  Global without a signed-in country, as song select does. */
export default function useBoardRows(beatmapId: number | undefined, on: boolean): BoardRow[] {
	const [account] = useSynced(Account.character);
	const [tab] = useSynced(SETTINGS.leaderboard);
	const local = tab === SCORE_TAB.LOCAL;
	const country = tab === SCORE_TAB.COUNTRY ? account?.country : undefined;
	return useAsync(async () => on && beatmapId !== undefined
		? await boardScores(beatmapId, local, country).catch(() => NONE)
		: NONE, [beatmapId, on, local, country]) ?? NONE;
}
