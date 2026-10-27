import './AudioPlayer.css';

import {
	faPause,
	faPlay,
	faVolumeHigh,
	faVolumeLow,
	faVolumeOff,
	faVolumeXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLingui } from '@lingui/react/macro';

import { length } from '@oss-idle/shared/display/length';
import useSynced from '@oss-idle/shared/hooks/useSynced';

import {
	pausePreview,
	preview,
	seekPreview,
	volume,
} from '../preview';

const volumeIcon = ({ level, muted }: { level: number, muted: boolean }) => {
	if (muted) return faVolumeXmark;
	if (level === 0) return faVolumeOff;
	return level < 0.4 ? faVolumeLow : faVolumeHigh;
};

/** osu!web's floating player: shows while a preview plays, with its progress and volume. */
export default function AudioPlayer() {
	const { t } = useLingui();
	const [playing] = useSynced(preview);
	const [vol] = useSynced(volume);
	const bar = (value: number) => ({ '--bar': value } as React.CSSProperties);

	return <div className='audio-player' data-visible={playing !== undefined}>
		<button type='button' className='audio-player__button' onClick={pausePreview} aria-label={t`play`}>
			<FontAwesomeIcon icon={playing?.state === 'paused' ? faPlay : faPause} fixedWidth />
		</button>
		<input
			type='range'
			className='audio-player__bar'
			min={0}
			max={1}
			step='any'
			value={playing?.progress ?? 0}
			style={bar(playing?.progress ?? 0)}
			onChange={e => seekPreview(Number(e.target.value))}
			aria-label={t`progress`}
		/>
		<div className='audio-player__timestamps'>
			{length(playing?.time ?? 0)}
			<span className='audio-player__total'>
				/ {playing?.duration ? length(playing.duration) : '--:--'}
			</span>
		</div>
		<button
			type='button'
			className='audio-player__button'
			onClick={() => void volume.set({
				...vol, muted: !vol.muted, 
			})}
			aria-label={t`mute`}
		>
			<FontAwesomeIcon icon={volumeIcon(vol)} fixedWidth />
		</button>
		<input
			type='range'
			className='audio-player__bar audio-player__bar--volume'
			min={0}
			max={1}
			step='any'
			value={vol.level}
			style={bar(vol.level)}
			onChange={e => void volume.set({
				...vol, level: Number(e.target.value), 
			})}
			aria-label={t`volume`}
		/>
	</div>;
}
