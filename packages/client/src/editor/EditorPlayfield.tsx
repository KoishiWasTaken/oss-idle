import { visualOptions } from './visualSetting';
import {
	useEffect,
	useRef,
} from 'react';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { currentSkin } from '../osu/skin/Skin';
import { SETTINGS } from '../db/settings';
import {
	fieldGeometry,
	timeAt,
} from './painter';
import EditorPointer, { type PointerAt } from './pointer';
import PlayfieldLink, { sideField } from './playfieldLink';
import type EditorSession from './session';

const SHIFT_STEPS = 4;

/** The chart under edit, drawn by its own worker (see playfieldWorker) and driven by the
 *  mouse (see EditorPointer); the wheel moves along the beat lines (shift: several),
 *  ctrl + wheel zooms. */
export default function EditorPlayfield({ session }: { session: EditorSession }) {
	const hostRef = useRef<HTMLDivElement>(null);
	const linkRef = useRef<PlayfieldLink>(undefined);
	const [skin] = useSynced(currentSkin);
	const skinRef = useRef(skin);
	skinRef.current = skin;

	useEffect(() => {
		linkRef.current?.skin(skin);
	}, [skin]);

	useEffect(() => {
		const host = hostRef.current!;
		// a canvas goes to a worker once: each mount draws on a new one
		const canvas = document.createElement('canvas');
		host.append(canvas);
		const link = new PlayfieldLink(canvas, session);
		linkRef.current = link;
		link.skin(skinRef.current);
		const pointer = new EditorPointer(session);
		let w = 0;
		let h = 0;

		const resize = () => {
			w = host.clientWidth;
			h = host.clientHeight;
			link.size(w, h);
		};
		const observer = new ResizeObserver(resize);
		observer.observe(host);
		resize();

		const sync = () => link.sync();
		void session.revision.sync(sync);
		const settings = [SETTINGS.editorPreview, SETTINGS.scrollspeed, visualOptions];
		for (const setting of settings) void setting.sync(sync);
		sync();

		const geometry = () =>
			fieldGeometry(session.chart.keys, sideField(session), skinRef.current, w, h);
		const pointed = (e: { clientX: number, clientY: number }): PointerAt => {
			const rect = host.getBoundingClientRect();
			const g = geometry();
			const x = (e.clientX - rect.left - g.x0) / g.columnWidth;
			const column = Math.floor(x);
			return {
				column: Math.min(g.keys - 1, Math.max(0, column)),
				x,
				time: timeAt(g, session.zoom, session.now(), e.clientY - rect.top),
				inside: column >= 0 && column < g.keys,
			};
		};
		// where the mouse last was, for a drag the wheel scrolls under it
		let last: { clientX: number, clientY: number } | undefined;
		const showPointer = () => link.overlay(pointer.overlay());

		const onDown = (e: MouseEvent) => {
			const tolerance = geometry().noteHeight / session.zoom;
			pointer.down(pointed(e), e.button, e.ctrlKey || e.metaKey, tolerance);
			showPointer();
		};
		const onMove = (e: MouseEvent) => {
			last = {
				clientX: e.clientX, clientY: e.clientY,
			};
			pointer.move(pointed(e));
			showPointer();
		};
		const onUp = () => {
			pointer.up();
			showPointer();
		};
		const onLeave = () => {
			pointer.leave();
			showPointer();
		};
		const onWheel = (e: WheelEvent) => {
			// alt + wheel is the volume
			if (e.altKey) return;
			e.preventDefault();
			if (e.ctrlKey) session.zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
			else session.step(e.deltaY > 0 ? 1 : -1, e.shiftKey ? SHIFT_STEPS : 1);
			// the chart moved under a still mouse: a drag follows it
			if (last) pointer.move(pointed(last));
			showPointer();
		};

		// while the song plays, a drag held still follows the chart moving under it
		let frame = 0;
		const follow = () => {
			frame = requestAnimationFrame(follow);
			if (!last || !pointer.dragging || !session.isPlaying) return;
			if (pointer.move(pointed(last))) showPointer();
		};
		frame = requestAnimationFrame(follow);

		host.addEventListener('mousedown', onDown);
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		host.addEventListener('mouseleave', onLeave);
		host.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
			session.revision.desync(sync);
			for (const setting of settings) setting.desync(sync);
			host.removeEventListener('mousedown', onDown);
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			host.removeEventListener('mouseleave', onLeave);
			host.removeEventListener('wheel', onWheel);
			link.dispose();
			linkRef.current = undefined;
			canvas.remove();
		};
	}, [session]);

	return <div ref={hostRef} className="editor__playfield" />;
}
