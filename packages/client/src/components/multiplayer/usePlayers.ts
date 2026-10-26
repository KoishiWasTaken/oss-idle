import { useMemo } from 'react';

import type { PresenceEntry } from '@oss-idle/shared/community/presence';
import useSynced from '@oss-idle/shared/hooks/useSynced';

import Socket from '../../online/socket';

/** Online players by character id - a match only carries ids. */
export default function usePlayers(): Map<number, PresenceEntry> {
	const [presence = []] = useSynced(Socket.presence);
	return useMemo(() => new Map(presence.map(p => [p.characterId, p])), [presence]);
}
