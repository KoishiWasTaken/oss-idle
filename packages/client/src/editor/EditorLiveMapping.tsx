import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	actions,
	appliesTo,
	keyBindings,
	keysOf,
} from './actions';
import {
	currentPlacing,
	placingOptions,
	type PlacingOptions,
} from './placing';
import {
	choices,
	whole,
	type Choice,
} from './viewControls';

/** Live mapping, as Quaver's: a column's own key places a note at the current time while
 *  the song plays (held, a long note). Each key mode has its keys, changed in the shortcuts. */
export default function EditorLiveMapping({ keys }: { keys: number }) {
	const { t } = useLingui();
	useSynced(placingOptions);
	const [all] = useSynced(actions);
	useSynced(keyBindings);
	const placing = currentPlacing();
	const set = (patch: Partial<PlacingOptions>) => placingOptions.set({
		...placing, ...patch,
	});
	const onOff: Choice<boolean>[] = [[true, t`On`], [false, t`Off`]];
	const columns = all.filter(action => action.group === 'live' && appliesTo(action, keys))
		.map(action => keysOf(action)[0] ?? '·');

	return (
		<>
			<div className='editor__commands-group'><Trans>Live mapping</Trans></div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'>{t`Keys (${keys}K)`}</span>
				<span className='editor__live-keys'>
					{columns.map((key, i) => <kbd key={i}>{key}</kbd>)}
				</span>
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Snap live notes while playing</Trans></span>
				{choices(onOff, placing.liveSnap, liveSnap => set({ liveSnap }))}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Live note offset (ms)</Trans></span>
				{whole(placing.liveOffset, -200, 200, liveOffset => set({ liveOffset }), t`Live note offset`)}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Hold a key for an LN</Trans></span>
				{choices(onOff, placing.liveHolds, liveHolds => set({ liveHolds }))}
			</div>
			{placing.liveHolds && (
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Shortest LN (ms)</Trans></span>
					{whole(placing.liveHoldMin, 0, 1000, liveHoldMin => set({ liveHoldMin }), t`Shortest LN`)}
				</div>
			)}
		</>
	);
}
