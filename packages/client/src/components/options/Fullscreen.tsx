import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import { applyFullscreen } from '../../responsive/fullscreen';
import Checkbox from './controls/Checkbox';

export default function Fullscreen() {
	return (
		<Checkbox
			value={SETTINGS.fullscreen}
			label={<Trans>Fullscreen mode</Trans>}
			onChange={applyFullscreen}
		/>
	);
}
