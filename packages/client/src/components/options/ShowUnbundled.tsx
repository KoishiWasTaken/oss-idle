import { Trans } from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import Checkbox from './controls/Checkbox';
import { SETTINGS } from '../../db/settings';

export default function ShowUnbundled() {
	const [showUndownloaded] = useSynced(SETTINGS.showUndownloaded);
	return <Checkbox value={SETTINGS.showUnbundled} disabled={!showUndownloaded} label={
		<Trans>Display non-bundled ranked beatmaps as downloadable in song select</Trans>
	} />;
}
