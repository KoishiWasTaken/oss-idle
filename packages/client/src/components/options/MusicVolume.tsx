import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Slider from './controls/Slider';

export default function MusicVolume() {
	return <Slider value={SETTINGS.musicVolume} label={<Trans>Music</Trans>} />;
}
