import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Checkbox from './controls/Checkbox';

export default function ShowFPS() {
	return <Checkbox value={SETTINGS.showFps} label={
		<Trans>Show FPS counter</Trans>
	} />;
}
