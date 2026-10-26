import './UpdateButton.css';

import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useState } from 'react';

import Log from '@oss-idle/shared/helpers/log';

import BeatmapAPI from '../../osu/beatmap/beatmap_api';

// Phosphor's arrow-counter-clockwise
const ARROW = 'M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63'
	+ 'A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8'
	+ 'V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z';

const Face = ({ busy }: { busy: boolean }) => (<>
	<svg viewBox="0 0 256 256" aria-hidden><path d={ARROW} /></svg>
	{busy ? <Trans>Updating…</Trans> : <Trans>Update to latest version</Trans>}
</>);

/** In place of the scores when the server's chart differs from the stored one: downloads
 *  the set again. */
export default function UpdateButton({ setId }: { setId: number }) {
	const { t } = useLingui();
	const [busy, setBusy] = useState(false);
	const update = () => {
		setBusy(true);
		BeatmapAPI.update(setId)
			.then(() => Log.popup(t`Beatmap updated`))
			.catch((e) => Log.errorPopup(String(e)))
			.finally(() => setBusy(false));
	};
	return (
		<button type="button" className="lb-update" disabled={busy} onClick={update}>
			<span className="lb-update__face"><Face busy={busy} /></span>
			{!busy && (
				<span className="lb-update__face lb-update__ghost" aria-hidden>
					<Face busy={busy} />
				</span>
			)}
		</button>
	);
}
