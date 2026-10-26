import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Checkbox from './controls/Checkbox';

export default function ShowThumbnails() {
	return <Checkbox value={SETTINGS.showThumbnails} label={
		<Trans>Show thumbnails</Trans>
	} />;
}
