import {
	faPause,
	faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import {
	preview,
	stopPreview,
	togglePreview,
} from '../../preview';

/** Plays the map's audio preview, with a bar for how far along it is. */
export default function PreviewButton({ setId, src }: { setId: number, src: string }) {
	const { t } = useLingui();
	const [playing] = useSynced(preview);
	const mine = playing?.setId === setId ? playing : undefined;

	useEffect(() => () => stopPreview(setId), [setId]);

	return <button
		type='button'
		className='mapset__preview'
		onClick={() => togglePreview(setId, src)}
		aria-label={t`preview`}
	>
		<FontAwesomeIcon icon={mine && mine.state !== 'paused' ? faPause : faPlay} />
		<span className='mapset__preview-bar' style={{ width: `${(mine?.progress ?? 0) * 100}%` }} />
	</button>;
}
