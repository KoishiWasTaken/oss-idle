import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { useLingui } from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import { SETTINGS } from '../../db/settings';
import PlayQueue, { AUTOPILOT_MODE } from '../../gameplay/playQueue';
import PlayManager from '../../online/playManager';
import DockIconButton from './DockIconButton';

/**
 * Whether the queue runs.
 *
 * A queue with nothing playing and nothing scheduled is sitting there: no play
 * is going to end and pull it along, so what it needs is a start, not a pause.
 * Once something is running (or waiting to), the same button holds it back and
 * lets it go again. Always in its place: with nothing to run it is disabled.
 */
export default function DockRunButton() {
	const { t } = useLingui();
	const [live] = useSynced(PlayManager.live);
	const [queue] = useSynced(PlayQueue.state);
	const [paused] = useSynced(PlayManager.paused);
	const [countdown] = useSynced(PlayManager.countdown);
	const [mode] = useSynced(SETTINGS.autopilotMode);

	// a Disabled queue stays paused: nothing to start, hold back or let go
	const usable = !!queue && !!PlayQueue.next() && mode !== AUTOPILOT_MODE.DISABLED;
	const waiting = !!live || paused || countdown !== undefined;
	if (!usable || !waiting) {
		return (
			<DockIconButton
				icon={faPlay}
				label={t`Start the queue`}
				disabled={!usable}
				onClick={() => PlayManager.startNow()}
			/>
		);
	}
	return (
		<DockIconButton
			icon={paused ? faPlay : faPause}
			label={paused ? t`Resume the queue` : t`Pause after this map`}
			onClick={() => PlayManager.setPaused(!paused)}
		/>
	);
}
