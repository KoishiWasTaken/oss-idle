import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Checkbox from './controls/Checkbox';

export default function OsuMusicTheme() {
	return <Checkbox value={SETTINGS.osuMusicTheme} label={
		<Trans>osu! music at startup</Trans>
	} />;
}
