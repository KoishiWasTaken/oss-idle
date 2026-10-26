import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Slider from './controls/Slider';

export default function MasterVolume() {
	return <Slider value={SETTINGS.mainVolume} label={<Trans>Master</Trans>} />;
}
