import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Slider from './controls/Slider';

export default function EffectVolume() {
	return <Slider value={SETTINGS.effectVolume} label={<Trans>Effect</Trans>} />;
}
