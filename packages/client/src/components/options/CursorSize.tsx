import { Trans } from '@lingui/react/macro';
import Slider from './controls/Slider';
import { SETTINGS } from '../../db/settings';

export default function CursorSize() {
	return <Slider
		value={SETTINGS.cursorSize}
		label={<Trans>Cursor size</Trans>}
		min={0.5}
		max={2}
		step={0.01}
		format={(n) => `${n.toFixed(2)}x`}
	/>;
}
