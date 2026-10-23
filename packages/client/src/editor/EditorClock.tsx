import {
	useEffect,
	useRef,
	type MouseEvent,
} from 'react';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import { clock } from './clock';
import type EditorSession from './session';
import EditorTimelineGraph from './EditorTimelineGraph';

/** How often the time is shown again. */
const TICK_MS = 50;

/** `text` into `into` a character a cell, digits in cells of one width: Exo 2's digits are
 *  not, and the time would shift as it counts. Only a changed character is written. */
const writeCells = (into: HTMLElement, text: string) => {
	if (into.childElementCount !== text.length) {
		into.replaceChildren(...Array.from(text, char => {
			const cell = document.createElement('span');
			if (char >= '0' && char <= '9') cell.className = 'editor__digit';
			return cell;
		}));
	}
	for (let i = 0; i < text.length; i++) {
		const cell = into.children[i];
		if (cell.textContent !== text[i]) cell.textContent = text[i];
	}
};

/** Where the song is, as a time and a track (press or drag along it to seek), its bookmarks on the track
 *  (click one to go there, right click to remove it). The time is written
 *  straight into the page as the song moves, so nothing re-renders 20 times a second. */
export default function EditorClock({ session, marks }: {
	session: EditorSession,
	/** what the timeline marks: the bookmarks, or the timing or SV points (the open tab's) */
	marks: 'bookmarks' | 'timing' | 'scroll',
}) {
	const { t } = useLingui();
	const timeRef = useRef<HTMLSpanElement>(null);
	const fillRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		let shown = NaN;
		const show = () => {
			const now = Math.floor(session.now());
			session.followSection(now);
			if (now === shown) return;
			shown = now;
			writeCells(timeRef.current!, clock(now));
			fillRef.current!.style.transform = `scaleX(${now / session.length})`;
		};
		show();
		const timer = setInterval(show, TICK_MS);
		return () => clearInterval(timer);
	}, [session]);

	// pressed, then dragged: the song follows the mouse along the track until released
	const seek = (e: MouseEvent<HTMLElement>) => {
		if (e.button !== 0) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const to = (x: number) =>
			session.seek(Math.min(1, Math.max(0, (x - rect.left) / rect.width)) * session.length);
		to(e.clientX);
		const move = (m: globalThis.MouseEvent) => to(m.clientX);
		const up = () => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', up);
		};
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', up);
	};

	return (
		<>
			<span className="ladder-sum__label"><Trans>Time</Trans></span>
			<span className="ladder-sum__value">
				<span ref={timeRef} /><span className="ladder-sum__of">/{clock(session.length)}</span>
			</span>
			<span className="ladder-sum__track editor__seek" onMouseDown={seek}>
				<EditorTimelineGraph session={session} marks={marks === 'bookmarks' ? undefined : marks} />
				<span ref={fillRef} className="editor__seek-fill" />
				{marks === 'bookmarks' && session.bookmarks.map(time => (
					<span
						key={time}
						className="editor__bookmark"
						aria-label={t`Bookmark at ${ph({ time: clock(time) })}`}
						style={{ left: `${time / session.length * 100}%` }}
						onContextMenu={e => e.preventDefault()}
						onMouseDown={e => {
							e.stopPropagation();
							if (e.button === 2) session.removeBookmark(time);
							else session.seek(time);
						}}
					/>
				))}
			</span>
		</>
	);
}
