import {
	useEffect,
	useState,
} from 'react';
import { Trans } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import EditorScrollPoint from './EditorScrollPoint';
import type EditorSession from './session';
import { pointsAround } from './pointWindow';


/** The SV tab: the scroll speed points around the current time - an SV-heavy map
 *  has thousands - and a new one at the current time. */
export default function EditorScroll({ session }: { session: EditorSession }) {
	useSynced(session.revision);
	// re-renders when the point in effect changes, not every tick
	const [, setActive] = useState(() => session.scrollAt(session.now()));

	useEffect(() => {
		const timer = setInterval(() => setActive(session.scrollAt(session.now())), 250);
		return () => clearInterval(timer);
	}, [session]);

	const points = session.scroll;
	const active = session.scrollAt(session.now());
	const { from, shown } = pointsAround(points, active);

	return (
		<div className="editor__stat editor__timing">
			<button className="editor__action" onClick={() => session.addScrollPoint()}>
				<Trans>Add at the current time</Trans>
			</button>
			<span className="editor__point editor__point--scroll editor__point--head">
				<span />
				<span className="ladder-sum__label"><Trans>Time (ms)</Trans></span>
				<span className="ladder-sum__label"><Trans>Speed</Trans></span>
				<span />
			</span>
			{shown.map((point, i) => (
				<EditorScrollPoint
					key={`${from + i}:${point.time}`}
					session={session}
					point={point}
					active={point === active}
				/>
			))}
			{points.length > shown.length && (
				<span className="editor__hint">
					<Trans>{ph({ shown: shown.length })} of {ph({ total: points.length })} points, around the current time</Trans>
				</span>
			)}
		</div>
	);
}
