import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Checkbox from './controls/Checkbox';

export default function ParallaxMode() {
	return <Checkbox value={SETTINGS.parallax} label={<Trans>Parallax</Trans>} />;
}
