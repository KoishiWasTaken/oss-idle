import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans } from '@lingui/react/macro';
import type { MouseEvent } from 'react';

import { mapDownloadLink } from '@oss-idle/shared/beatmap';

import { sendToGame } from '../../api/maps';

/** Downloads the set into the game (see sendToGame). */
export default function DownloadButton({ setId }: { setId: number }) {
	const send = (e: MouseEvent) => {
		e.preventDefault();
		sendToGame(setId);
	};
	return <a href={mapDownloadLink(setId)} onClick={send} className='mapset__button'>
		<FontAwesomeIcon icon={faDownload} /> <Trans>Download</Trans>
	</a>;
}
