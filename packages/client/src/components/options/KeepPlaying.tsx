import { Trans } from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import Auth from '../../online/auth';
import { keepPlaying } from '../../online/queuePrefs';
import Checkbox from './controls/Checkbox';

export default function KeepPlaying() {
	const [user] = useSynced(Auth.user);
	if (!user) return <></>;
	return <Checkbox value={keepPlaying} label={
		<Trans>Keep playing the queue when the game is closed</Trans>
	} />;
}
