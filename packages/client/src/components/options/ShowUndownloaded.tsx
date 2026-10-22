import { Trans } from '@lingui/react/macro';
import Checkbox from './controls/Checkbox';
import { SETTINGS } from '../../db/settings';

export default function ShowUndownloaded() {
	return <Checkbox value={SETTINGS.showUndownloaded} label={
		<Trans>Show beatmaps that aren't downloaded</Trans>
	} />;
}
