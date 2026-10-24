import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faPause,
	faPlay,
} from '@fortawesome/free-solid-svg-icons';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	coverBackground,
	type Nomination,
	nominationPreviewUrl,
} from '../../api/maps';
import {
	preview,
	stopPreview,
	togglePreview,
} from '../../preview';

/** The set's cover; clicking it plays the audio preview. */
export default function NominationCover({ row }: { row: Nomination }) {
	const [playing] = useSynced(preview);
	const mine = playing?.setId === row.id;
	useEffect(() => () => stopPreview(row.id), [row.id]);

	return (
		<button
			type='button'
			className={`nomination__cover ${mine ? 'is-playing' : ''}`}
			style={{ backgroundImage: coverBackground(row, 'list') }}
			disabled={!row.audio}
			aria-label='Preview'
			onClick={() => togglePreview(row.id, nominationPreviewUrl(row.id, row.audio!))}
		>
			{row.audio && <FontAwesomeIcon icon={mine ? faPause : faPlay} />}
		</button>
	);
}
