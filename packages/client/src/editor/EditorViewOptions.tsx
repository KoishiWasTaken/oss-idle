import {
	Trans,
	useLingui,
} from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import { SETTINGS } from '../db/settings';
import type LightBeatmap from '../osu/beatmap/LightBeatmap';
import EditorLiveMapping from './EditorLiveMapping';
import EditorPlacingOptions from './EditorPlacingOptions';
import type EditorSession from './session';
import {
	type Choice,
	choices,
	slider,
	toggle,
} from './viewControls';
import type {
	FieldOptions,
	FrequencyScale,
	VisualOptions,
	WaveformFilter,
} from './visualOptions';
import {
	currentVisuals,
	visualOptions,
} from './visualSetting';

/** The view tab: how the field is drawn (as Quaver's view menu), and the song behind it
 *  (waveform, spectrogram). */
export default function EditorViewOptions({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(visualOptions);
	const [preview] = useSynced(SETTINGS.editorPreview);
	useSynced(session.revision);
	const others: Choice<LightBeatmap | undefined>[] = [
		[undefined, t`None`],
		...session.otherDifficulties
			.map((beatmap): Choice<LightBeatmap> => [beatmap, beatmap.metadata.version]),
	];
	const options = currentVisuals();
	const { field, waveform, spectrogram } = options;
	const setField = (patch: Partial<FieldOptions>) => visualOptions.set({
		...options, field: {
			...field, ...patch,
		},
	});
	const setWaveform = (patch: Partial<VisualOptions['waveform']>) => visualOptions.set({
		...options, waveform: {
			...waveform, ...patch, 
		}, 
	});
	const setSpectrogram = (patch: Partial<VisualOptions['spectrogram']>) => visualOptions.set({
		...options, spectrogram: {
			...spectrogram, ...patch, 
		}, 
	});
	const filters: Choice<WaveformFilter>[] = [['none', t`None`], ['low', t`Lows`], ['high', t`Highs`]];
	const details: Choice<number>[] = [
		[512, t`Fast`], [1024, t`Normal`], [2048, t`Fine`], [4096, t`Finest`],
	];
	const scales: Choice<FrequencyScale>[] = [['log', t`Musical`], ['linear', t`Linear`]];
	const hz = (value: number, set: (n: number) => void, label: string) => (
		<input
			className='editor__field editor__field--short'
			type='number'
			min={20}
			max={22000}
			key={value}
			defaultValue={value}
			aria-label={label}
			onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
			onBlur={e => {
				const n = Math.round(Number(e.currentTarget.value));
				if (Number.isFinite(n) && n >= 20 && n <= 22000) set(n);
			}}
		/>
	);

	const lineColours: Choice<FieldOptions['snapColours']>[] = [
		['snap', t`By snap`], ['white', t`White`],
	];

	return (
		<>
			<div className='editor__commands-group'><Trans>Field</Trans></div>
			<div className='editor__stat editor__switches'>
				{toggle(<Trans>Live preview</Trans>, preview, on => void SETTINGS.editorPreview.set(on))}
				{toggle(<Trans>Bookmarks</Trans>, field.bookmarks, bookmarks => setField({ bookmarks }))}
			</div>
			{others.length > 1 && (
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Reference difficulty</Trans></span>
					{choices(others, session.reference?.beatmap, beatmap => void session.setReference(beatmap))}
				</div>
			)}
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Background brightness</Trans></span>
				{slider(
					field.brightness, brightness => setField({ brightness }), t`Background brightness`, 0, 10,
				)}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Playfield opacity</Trans></span>
				{slider(field.playfield, playfield => setField({ playfield }), t`Playfield opacity`, 0, 10)}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>LN opacity</Trans></span>
				{slider(field.holds, holds => setField({ holds }), t`LN opacity`, 30, 10)}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Beat lines</Trans></span>
				{choices(lineColours, field.snapColours, snapColours => setField({ snapColours }))}
			</div>

			<EditorPlacingOptions />

			<div className='editor__commands-group'><Trans>Waveform</Trans></div>
			<div className='editor__stat editor__switches'>
				{toggle(<Trans>Show</Trans>, waveform.visible, visible => setWaveform({ visible }))}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Brightness</Trans></span>
				{slider(waveform.brightness, brightness => setWaveform({ brightness }), t`Waveform brightness`)}
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Colour</Trans></span>
				<input
					className='editor__colour'
					type='color'
					value={waveform.colour}
					aria-label={t`Waveform colour`}
					onChange={e => setWaveform({ colour: e.target.value })}
				/>
			</div>
			<div className='editor__stat'>
				<span className='ladder-sum__label'><Trans>Filter</Trans></span>
				{choices(filters, waveform.filter, filter => setWaveform({ filter }))}
			</div>

			<div className='editor__commands-group'><Trans>Spectrogram</Trans></div>
			<div className='editor__stat editor__switches'>
				{toggle(<Trans>Show</Trans>, spectrogram.visible, visible => setSpectrogram({ visible }))}
			</div>
			{spectrogram.visible && <>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Detail</Trans></span>
					{choices(details, spectrogram.fftSize, fftSize => setSpectrogram({ fftSize }))}
				</div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Frequencies</Trans></span>
					{choices(scales, spectrogram.scale, scale => setSpectrogram({ scale }))}
				</div>
				<div className='editor__stat editor__row'>
					<label className='ladder-sum__label'>
						<Trans>From (Hz)</Trans>
						{hz(spectrogram.minHz, minHz => setSpectrogram({ minHz }), t`Lowest frequency`)}
					</label>
					<label className='ladder-sum__label'>
						<Trans>To (Hz)</Trans>
						{hz(spectrogram.maxHz, maxHz => setSpectrogram({ maxHz }), t`Highest frequency`)}
					</label>
				</div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Intensity</Trans></span>
					{slider(
						spectrogram.intensity, intensity => setSpectrogram({ intensity }), t`Spectrogram intensity`,
					)}
				</div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Quiet cut-off</Trans></span>
					{slider(spectrogram.cutoff, cutoff => setSpectrogram({ cutoff }), t`Spectrogram cut-off`)}
				</div>
			</>}

			<EditorLiveMapping keys={session.chart.keys} />
		</>
	);
}
