import { Trans } from '@lingui/react/macro';

import { SETTINGS } from '../../db/settings';
import Slider from './controls/Slider';

export default function RightClickHold() {
	return <Slider
		value={SETTINGS.longpress}
		label={<Trans>(mobile) Tap duration to right click</Trans>}
		min={200}
		max={500}
		step={10}
		format={(n) => `${n}ms`}
	/>;
}
