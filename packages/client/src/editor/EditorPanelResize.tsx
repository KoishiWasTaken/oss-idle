import {
	type PointerEvent,
	useEffect,
	useRef,
} from 'react';

import { panelWidths } from './visualSetting';

const MIN_WIDTH = 220;

/** A side panel's inner edge: dragged, the panel takes that width, kept for next time. */
export default function EditorPanelResize({ side }: { side: 'left' | 'right' }) {
	const ref = useRef<HTMLDivElement>(null);
	const panel = () => ref.current!.parentElement!;

	useEffect(() => {
		const width = panelWidths.get()[side];
		if (width) panel().style.width = `${width}px`;
	}, [side]);

	const drag = (e: PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		e.preventDefault();
		const handle = e.currentTarget;
		handle.setPointerCapture(e.pointerId);
		const from = e.clientX;
		const start = panel().getBoundingClientRect().width;
		let width = start;
		const move = (m: globalThis.PointerEvent) => {
			const moved = side === 'left' ? m.clientX - from : from - m.clientX;
			width = Math.round(Math.min(window.innerWidth * 0.45, Math.max(MIN_WIDTH, start + moved)));
			panel().style.width = `${width}px`;
		};
		const up = () => {
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', up);
			if (width !== start) void panelWidths.set({
				...panelWidths.get(), [side]: width, 
			});
		};
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', up);
	};

	return <div ref={ref} className="editor__panel-resize" onPointerDown={drag} />;
}
