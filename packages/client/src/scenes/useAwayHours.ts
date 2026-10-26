import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	AWAY_HOURS,
	SUPPORTER_AWAY_HOURS,
} from '@oss-idle/shared/queue';

import PlayQueue from '../gameplay/playQueue';
import Auth from '../online/auth';
import PlayManager from '../online/playManager';
import { keepPlaying } from '../online/queuePrefs';

/** How long the character keeps playing once the game is closed - none when
 *  nothing would play (signed out, option off, empty or paused queue). */
export default function useAwayHours(): number | undefined {
	const [user] = useSynced(Auth.user);
	const [keep] = useSynced(keepPlaying);
	const [queue] = useSynced(PlayQueue.state);
	const [paused] = useSynced(PlayManager.paused);
	if (!user || !keep || paused || !queue?.entries.length) return undefined;
	return user.supporter ? SUPPORTER_AWAY_HOURS : AWAY_HOURS;
}
