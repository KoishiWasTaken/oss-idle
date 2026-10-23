import {
	useEffect,
	useRef,
	useState,
} from 'react';
import { Trans } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { inEffect } from '@oss-idle/shared/editor/chart';
import EditorTimingPoint from './EditorTimingPoint';
import EditorBpmTools from './EditorBpmTools';
import type EditorSession from './session';
import { pointsAround } from './pointWindow';

/** Up to this many BPM points are all listed; more, and those around the current time. */
const LIST_ALL = 40;

/** The timing tab: adding a point and finding the tempo on top, then the chart's BPM
 *  points (those around the current time in a long list), the one in effect lit and kept in
 *  view. Moving one leaves the notes where they are. */
export default function EditorTiming({ session }: { session: EditorSession }) {
	useSynced(session.revision);
	// re-renders when the point in effect changes, not every tick
	const [active, setActive] = useState(() => inEffect(session.timing, session.now()));
	const list = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const follow = () => setActive(inEffect(session.timing, session.now()));
		follow();
		const timer = setInterval(follow, 250);
		return () => clearInterval(timer);
	}, [session, session.timing]);

	useEffect(() => {
		list.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
	}, [active]);

	const { from, shown } = pointsAround(session.timing, active, LIST_ALL);

	return (
		<div className="editor__stat editor__timing editor__timing--points">
			<button className="editor__action" onClick={() => session.addTimingPoint()}>
				<Trans>Add at the current time</Trans>
			</button>
			<EditorBpmTools session={session} />
			<span className="editor__point editor__point--head">
				<span />
				<span className="ladder-sum__label"><Trans>Time (ms)</Trans></span>
				<span className="ladder-sum__label"><Trans>BPM</Trans></span>
				<span className="ladder-sum__label"><Trans>Bar</Trans></span>
				<span className="ladder-sum__label"><Trans>Snap</Trans></span>
				<span className="ladder-sum__label"><Trans>Line</Trans></span>
				<span />
			</span>
			<div className="editor__point-list" ref={list}>
				{shown.map((point, i) => (
					<EditorTimingPoint
						key={`${from + i}:${point.time}`}
						session={session}
						point={point}
						active={point === active}
					/>
				))}
			</div>
			{shown.length < session.timing.length && (
				<span className="editor__hint">
					<Trans>{ph({ shown: shown.length })} of {ph({ total: session.timing.length })} points</Trans>
				</span>
			)}
		</div>
	);
}
