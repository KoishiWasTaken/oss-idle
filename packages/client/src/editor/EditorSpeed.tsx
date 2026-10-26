import {
	Trans,
	useLingui,
} from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import type EditorSession from './session';

/** The playback speed, a step down or up, or back to 100%. */
export default function EditorSpeed({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	return (
		<div className="editor__stat editor__speed-row">
			<span className="ladder-sum__label"><Trans>Playback speed</Trans></span>
			<span className="editor__divisors">
				<button onClick={() => void session.stepSpeed(-1)} aria-label={t`Slower`}>−</button>
				<span className={session.speed === session.playbackRate
					? 'editor__speed' : 'editor__speed is-pending'}>
					{Math.round(session.speed * 100)}%
				</span>
				<button onClick={() => void session.stepSpeed(1)} aria-label={t`Faster`}>+</button>
				<button disabled={session.speed === 1} onClick={() => void session.setSpeed(1)}>
					<Trans>Reset</Trans>
				</button>
			</span>
		</div>
	);
}
