import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Slider from './controls/Slider';

export default function BackgroundDim() {
	return (
		<Slider
			value={SETTINGS.backgroundDim}
			label={<Trans>Background dim</Trans>}
			min={0}
			max={1}
			step={0.01}
		/>
	);
}
