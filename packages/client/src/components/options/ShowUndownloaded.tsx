import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Checkbox from './controls/Checkbox';

export default function ShowUndownloaded() {
	return <Checkbox value={SETTINGS.showUndownloaded} label={
		<Trans>Show beatmaps that aren't downloaded</Trans>
	} />;
}
