import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { askFor } from './commandList';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { SETTINGS } from '../db/settings';
import type EditorSession from './session';
import {
	METRONOME,
	hitsoundsOn,
	metronome,
} from './editorSounds';

/** The compose tab: the beat snap, the playback speed and pitch, the live preview on or off. */
export default function EditorCompose({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	const [preview] = useSynced(SETTINGS.editorPreview);
	const [ticks] = useSynced(metronome);
	const [hits] = useSynced(hitsoundsOn);
	const tickLabels = {
		off: t`Off`, beats: t`Beats`, halves: t`Half beats`,
	};

	return (
		<>
			<div className="editor__stat">
				<span className="ladder-sum__label"><Trans>Beat snap</Trans></span>
				<span className="editor__divisors">
					{session.divisors.map(divisor => (
						<button
							key={divisor}
							className={divisor === session.divisor ? 'is-active' : ''}
							onClick={() => session.setDivisor(divisor)}
						>
							1/{divisor}
						</button>
					))}
					<button onClick={() => askFor('timing.customSnap')}>
						<Trans>Custom</Trans>
					</button>
				</span>
			</div>
			<div className="editor__stat">
				<span className="ladder-sum__label"><Trans>Playback speed</Trans></span>
				<span className="editor__divisors">
					<button onClick={() => void session.stepSpeed(-1)} aria-label={t`Slower`}>−</button>
					<span className={session.speed === session.playbackRate
						? 'editor__speed' : 'editor__speed is-pending'}>
						{Math.round(session.speed * 100)}%
					</span>
					<button onClick={() => void session.stepSpeed(1)} aria-label={t`Faster`}>+</button>
				</span>
			</div>
			<div className="editor__stat">
				<span className="ladder-sum__label"><Trans>Keep the pitch</Trans></span>
				<span className="editor__divisors editor__toggle">
					<button
						className={session.pitchKept ? 'is-active' : ''}
						onClick={() => void session.setSpeed(session.speed, true)}
					>
						<Trans>On</Trans>
					</button>
					<button
						className={session.pitchKept ? '' : 'is-active'}
						onClick={() => void session.setSpeed(session.speed, false)}
					>
						<Trans>Off</Trans>
					</button>
				</span>
			</div>
			<div className="editor__stat">
				<span className="ladder-sum__label"><Trans>Hitsounds</Trans></span>
				<span className="editor__divisors editor__toggle">
					<button className={hits ? 'is-active' : ''} onClick={() => hitsoundsOn.set(true)}>
						<Trans>On</Trans>
					</button>
					<button className={hits ? '' : 'is-active'} onClick={() => hitsoundsOn.set(false)}>
						<Trans>Off</Trans>
					</button>
				</span>
			</div>
			<div className="editor__stat">
				<span className="ladder-sum__label"><Trans>Metronome</Trans></span>
				<span className="editor__divisors editor__toggle">
					{METRONOME.map(mode => (
						<button
							key={mode}
							className={mode === ticks ? 'is-active' : ''}
							onClick={() => metronome.set(mode)}
						>
							{tickLabels[mode]}
						</button>
					))}
				</span>
			</div>
			<div className="editor__stat">
				<span className="ladder-sum__label"><Trans>Live preview</Trans></span>
				<span className="editor__divisors editor__toggle">
					<button className={preview ? 'is-active' : ''} onClick={() => SETTINGS.editorPreview.set(true)}>
						<Trans>On</Trans>
					</button>
					<button className={preview ? '' : 'is-active'} onClick={() => SETTINGS.editorPreview.set(false)}>
						<Trans>Off</Trans>
					</button>
				</span>
			</div>
		</>
	);
}
