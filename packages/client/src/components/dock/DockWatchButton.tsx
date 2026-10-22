import { useLingui } from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import PlayManager from '../../online/playManager';
import PlayQueue from '../../gameplay/playQueue';
import { launchPlay } from '../../scenes/launchPlay';
import { playFromList } from '../songselect/listPlay';
import { focusInCarousel } from '../songselect/selection';
import DockIconButton from './DockIconButton';

/**
 * Find the map, then watch it.
 *
 * In front of a carousel what you usually want is to see the map among your own
 * - to queue what should follow it - so it plays it the way the list does,
 * which is what arms the queue from what is on screen. A running play is joined
 * rather than restarted. Only when the map is not in the list does it fall back
 * to spectating it alone, with nothing queued behind it.
 *
 * With nothing running there is nothing to watch, but the map that plays next is
 * still worth finding; starting it is the queue's business, not this button's.
 */
export default function DockWatchButton() {
	const { t } = useLingui();
	const [live] = useSynced(PlayManager.live);
	const [queue] = useSynced(PlayQueue.state);

	const target = live?.beatmap ?? (queue ? PlayQueue.next() : undefined);

	const press = () => {
		if (!target) return;
		if (!live) {
			focusInCarousel(target);
			return;
		}
		if (playFromList.get()?.(live.beatmap)) return;
		launchPlay(live.beatmap);
	};

	return (
		<DockIconButton
			icon={faEye}
			label={live ? t`Watch` : t`Find the next map`}
			disabled={!target}
			onClick={press}
		/>
	);
}
