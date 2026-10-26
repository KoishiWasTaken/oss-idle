import {
	Trans,
	useLingui,
} from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import { askFor } from './commandList';
import {
	hitsoundsOn,
	METRONOME,
	metronome,
} from './editorSounds';
import type EditorSession from './session';
import {
	type Choice,
	cycle,
	toggle,
} from './viewControls';

/** The compose tab: the beat snap, the pitch at other speeds, the hitsounds and metronome. */
export default function EditorCompose({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	const [ticks] = useSynced(metronome);
	const [hits] = useSynced(hitsoundsOn);
	const tickLabels = {
		off: t`Off`, beats: t`Beats`, halves: t`Half beats`,
	};
	const ticksChoices = METRONOME.map((mode): Choice<typeof mode> => [mode, tickLabels[mode]]);

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
			<div className="editor__stat editor__switches">
				{toggle(
					<Trans>Keep the pitch</Trans>,
					session.pitchKept,
					on => void session.setSpeed(session.speed, on),
				)}
				{toggle(<Trans>Hitsounds</Trans>, hits, on => hitsoundsOn.set(on))}
				{cycle(<Trans>Metronome</Trans>, ticksChoices, ticks, mode => metronome.set(mode))}
			</div>
		</>
	);
}
