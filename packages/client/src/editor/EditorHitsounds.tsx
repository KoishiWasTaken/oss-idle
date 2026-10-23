import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useEffect } from 'react';
import { ph } from '@lingui/core/macro';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	ADDITIONS,
	SAMPLE_SET_IDS,
	hasAddition,
	parsePointSound,
	parseSample,
	type Addition,
	type NoteSample,
} from '@oss-idle/shared/editor/hitsounds';
import { pickFiles } from '../pickFile';
import { sampleFiles } from './save';
import type EditorSession from './session';
import EditorSoundFiles from './EditorSoundFiles';

/** The value every one of `values` shares, or undefined when they differ. */
const shared = <T,>(values: T[]): T | undefined =>
	(values.every(value => value === values[0]) ? values[0] : undefined);

/** The custom indices the map has hitsound files for, each with its files: 1 for the
 *  unnumbered ones (soft-hitclap.wav), 2 and up for those numbered so (soft-hitclap2.wav). */
const sampleIndices = (files: string[]): Map<number, string[]> => {
	const indices = new Map<number, string[]>();
	for (const file of files) {
		const named = /^(?:normal|soft|drum)-hit(?:normal|whistle|finish|clap)(\d*)\.\w+$/i.exec(file);
		if (!named) continue;
		const index = named[1] ? Number(named[1]) : 1;
		indices.set(index, [...indices.get(index) ?? [], file]);
	}
	return indices;
};

/** A number box that writes on Enter or when it loses focus. */
const numberField = (value: number | undefined, write: (n: number) => void, max: number) => (
	<input
		className='editor__field editor__field--short'
		type='number'
		min={0}
		max={max}
		key={value ?? 'mixed'}
		defaultValue={value ?? ''}
		placeholder='-'
		onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
		onBlur={e => {
			const n = Math.round(Number(e.currentTarget.value));
			const typed = e.currentTarget.value !== '' && Number.isFinite(n);
			if (typed && n !== value) write(Math.min(max, Math.max(0, n)));
		}}
	/>
);

/**
 * The hitsounds tab: the selected notes' additions, sample sets, custom index, volume
 * and own sample file; and the sample defaults of the line in effect at the current time,
 * which the notes leaving them to the line take.
 */
export default function EditorHitsounds({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	useEffect(() => {
		session.setShowSounds(true);
		return () => session.setShowSounds(false);
	}, [session]);
	const files = useAsync(
		() => sampleFiles(session.beatmap, session.chart.audio), [session.beatmap],
	) ?? [];
	const selection = session.selection;
	const samples = selection.map(note => parseSample(note.sample));
	const common = <K extends keyof NoteSample>(key: K) => shared(samples.map(sample => sample[key]));
	const setLabels = {
		auto: t`Auto`, normal: t`Normal`, soft: t`Soft`, drum: t`Drum`,
	};
	const additionLabels: Record<Addition, string> = {
		whistle: t`Whistle`, finish: t`Finish`, clap: t`Clap`,
	};
	const indices = sampleIndices(files);
	/** The custom indices to pick from: `none` (0), each the map has files for, and the
	 *  current one even with none. */
	const indexField = (value: number | undefined, write: (index: number) => void, none: string) => {
		const offered = [...new Set([...indices.keys(), ...value ? [value] : []])].sort((a, b) => a - b);
		const label = (index: number) => {
			const named = indices.get(index);
			return named ? `${index} · ${named[0]}${named.length > 1 ? ' …' : ''}`
				: t`${ph({ index })} · no files`;
		};
		return (
			<select
				className='editor__field'
				value={value ?? ''}
				onChange={e => write(Number(e.target.value))}
			>
				{value === undefined && <option value='' disabled>{t`Mixed`}</option>}
				<option value={0}>{none}</option>
				{offered.map(index => <option key={index} value={index}>{label(index)}</option>)}
			</select>
		);
	};
	const point = session.soundPoint;
	const pointSound = point && parsePointSound(point.sound);
	const setPointIndex = (index: number) => session.setPointSound({ index });
	const setPointVolume = (volume: number) => session.setPointSound({ volume });

	const sets = (value: number | undefined, write: (id: number) => void) => (
		<span className='editor__divisors'>
			{SAMPLE_SET_IDS.map((id, i) => (
				<button key={id} className={value === i ? 'is-active' : ''} onClick={() => write(i)}>
					{setLabels[id]}
				</button>
			))}
		</span>
	);
	const addSamples = async () => {
		const picked = await pickFiles('audio/wav,audio/ogg,audio/mpeg,.wav,.ogg,.mp3');
		if (picked.length) await session.addSamples(picked);
	};

	return (
		<>
			{selection.length === 0 && (
				<span className='editor__hint'><Trans>Select notes to set their hitsounds</Trans></span>
			)}
			{selection.length > 0 && <>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Additions</Trans></span>
					<span className='editor__divisors'>
						{(Object.keys(ADDITIONS) as Addition[]).map(addition => {
							const count = selection.filter(note => hasAddition(note, addition)).length;
							return (
								<button
									key={addition}
									className={count === selection.length ? 'is-active'
										: count ? 'is-partial' : ''}
									onClick={() => session.toggleAddition(addition)}
								>
									{additionLabels[addition]}
								</button>
							);
						})}
					</span>
				</div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Sample set</Trans></span>
					{sets(common('normalSet'), id => session.patchSample({ normalSet: id }))}
				</div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Additions' set</Trans></span>
					{sets(common('additionSet'), id => session.patchSample({ additionSet: id }))}
				</div>
				<div className='editor__stat editor__row'>
					<label className='ladder-sum__label'>
						<Trans>Custom index</Trans>
						{indexField(common('index'), index => session.patchSample({ index }), t`From the line`)}
					</label>
					<label className='ladder-sum__label'>
						<Trans>Volume</Trans>
						{numberField(common('volume'), volume => session.patchSample({ volume }), 100)}
					</label>
				</div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Sample file</Trans></span>
					<span className='editor__row'>
						<select
							className='editor__field'
							value={common('file') ?? ''}
							onChange={e => session.patchSample({ file: e.target.value })}
						>
							<option value=''>{t`None (the sample set's)`}</option>
							{files.map(file => <option key={file} value={file}>{file}</option>)}
						</select>
						<button className='editor__small' onClick={() => void addSamples()}>
							<Trans>Add...</Trans>
						</button>
					</span>
				</div>
				<span className='editor__hint'>
					<Trans>
						The custom index picks the map's own hitsound files: 1 its unnumbered ones
						(soft-hitclap.wav), 2 and up those numbered so (soft-hitclap2.wav). A note
						without them plays the default sounds. A volume of 0 falls back to the line.
					</Trans>
				</span>
			</>}
			{point && pointSound && <>
				<div className='editor__commands-group'><Trans>The line in effect here</Trans></div>
				<div className='editor__stat'>
					<span className='ladder-sum__label'><Trans>Sample set</Trans></span>
					{sets(pointSound.set, set => session.setPointSound({ set }))}
				</div>
				<div className='editor__stat editor__row'>
					<label className='ladder-sum__label'>
						<Trans>Custom index</Trans>
						{indexField(pointSound.index, setPointIndex, t`Default sounds`)}
					</label>
					<label className='ladder-sum__label'>
						<Trans>Volume</Trans>
						{numberField(pointSound.volume, setPointVolume, 100)}
					</label>
				</div>
			</>}
			<EditorSoundFiles session={session} files={files} />
		</>
	);
}
