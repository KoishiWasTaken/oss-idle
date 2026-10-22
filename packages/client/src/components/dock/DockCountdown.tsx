import { Trans } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import PlayManager from '../../online/playManager';

/** When the next map starts: paused, in so many seconds, or after this one. */
export default function DockCountdown() {
	const [paused] = useSynced(PlayManager.paused);
	const [countdown] = useSynced(PlayManager.countdown);
	const [live] = useSynced(PlayManager.live);
	if (paused) return <span className="dock__when is-paused"><Trans>paused</Trans></span>;
	if (countdown !== undefined) {
		return <span className="dock__when is-counting"><Trans>{ph({ seconds: countdown })}s</Trans></span>;
	}
	if (live) return <span className="dock__when"><Trans>after this map</Trans></span>;
	return null;
}
