import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons/faFloppyDisk';
import { faForwardStep } from '@fortawesome/free-solid-svg-icons/faForwardStep';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons/faTrashCan';
import { faTv } from '@fortawesome/free-solid-svg-icons/faTv';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import PlayQueue from '../../gameplay/playQueue';
import PlayManager from '../../online/playManager';
import SceneManager, { SCENE } from '../../scenes/SceneManager';
import {
	enterScreensaver,
	leaveScreensaver,
} from '../../scenes/screensaver';
import DockIconButton from './DockIconButton';
import DockRunButton from './DockRunButton';
import DockWatchButton from './DockWatchButton';
import SaveQueuePrompt from './SaveQueuePrompt';

type Props = {
	/** the pill: only what a playing screen needs */
	compact?: boolean;
};

/** The queue's controls, as one row of icons. Every one keeps its place, and is
 *  disabled rather than taken away when there is nothing for it to do: a button
 *  must never move while the cursor is on its way to it. */
export default function DockTransport({ compact = false }: Props) {
	const { t } = useLingui();
	const [queue] = useSynced(PlayQueue.state);
	const [scene] = useSynced(SceneManager.current);
	const [saving, setSaving] = useState(false);
	const saver = scene === SCENE.SAVER;
	const next = queue ? PlayQueue.next() : undefined;

	return (
		<div className="dock__transport">
			<DockRunButton />
			<DockIconButton
				icon={faForwardStep}
				label={t`Skip to the next map`}
				disabled={!next}
				onClick={() => void PlayManager.skip()}
			/>
			{/* the same slot: the screensaver over a play, finding it anywhere else */}
			{saver || scene === SCENE.GAME
				? <DockIconButton
					icon={faTv}
					label={saver ? t`Back to gameplay` : t`Screensaver`}
					on={saver}
					onClick={saver ? leaveScreensaver : enterScreensaver}
				/>
				: <DockWatchButton />}
			{!compact && (
				<DockIconButton
					icon={faFloppyDisk}
					label={t`Save the queue as a playlist`}
					disabled={!queue?.entries.length}
					onClick={() => setSaving(true)}
				/>
			)}
			{!compact && (
				<DockIconButton
					icon={faTrashCan}
					label={t`Empty the queue`}
					disabled={!queue?.entries.length}
					onClick={() => PlayQueue.clear()}
				/>
			)}
			{saving && <SaveQueuePrompt onClose={() => setSaving(false)} />}
		</div>
	);
}
