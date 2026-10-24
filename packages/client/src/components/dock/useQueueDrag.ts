import {
	useState,
	type PointerEvent,
	type RefObject,
} from 'react';
import PlayQueue from '../../gameplay/playQueue';

type Drag = { from: number; to: number };

/** Rows dragged by pointer rather than native drag and drop, which would
 *  freeze the game's cursor. Returns the rows in the order to draw while one is held. */
export default function useQueueDrag<T>(list: RefObject<HTMLOListElement | null>, items: T[]) {
	const [drag, setDrag] = useState<Drag>();

	const rows = items.map((item, from) => ({
		item, from, 
	}));
	if (drag) rows.splice(drag.to, 0, ...rows.splice(drag.from, 1));

	const start = (from: number) => (e: PointerEvent<HTMLLIElement>) => {
		if (e.button !== 0 || (e.target as Element).closest('button')) return;
		e.preventDefault();
		const row = e.currentTarget;
		let to = from;
		const move = (m: globalThis.PointerEvent) => {
			const others = [...list.current!.children].filter(el => el !== row);
			to = others.filter(el => {
				const r = el.getBoundingClientRect();
				return r.top + r.height / 2 < m.clientY;
			}).length;
			setDrag({
				from, to, 
			});
		};
		const up = () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
			window.removeEventListener('pointercancel', up);
			PlayQueue.move(from, to);
			setDrag(undefined);
		};
		// not pointer capture: reordering the rows moves this one in the DOM, which drops it
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		window.addEventListener('pointercancel', up);
	};

	return {
		rows, dragging: drag?.from, start, 
	};
}
