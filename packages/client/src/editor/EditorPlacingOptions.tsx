import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	currentPlacing,
	placingOptions,
	type PlacingOptions,
} from './placing';
import {
	choices,
	type Choice,
} from './viewControls';

/** How a click places a note: on the nearest beat line or the one before. */
export default function EditorPlacingOptions() {
	const { t } = useLingui();
	useSynced(placingOptions);
	const placing = currentPlacing();
	const set = (patch: Partial<PlacingOptions>) => placingOptions.set({
		...placing, ...patch,
	});
	const ticks: Choice<boolean>[] = [[true, t`Nearest`], [false, t`Before`]];

	return (
		<>
			<div className='editor__commands-group'><Trans>Placing</Trans></div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Snap to</Trans></span>
				{choices(ticks, placing.nearestTick, nearestTick => set({ nearestTick }))}
			</div>
		</>
	);
}
