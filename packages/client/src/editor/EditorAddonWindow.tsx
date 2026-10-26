import { useLingui } from '@lingui/react/macro';
import {
	type MouseEvent,
	useRef,
	useState,
} from 'react';

import type { AddonWindow } from './addonUi';
import EditorAddonMount from './EditorAddonMount';

/** An add-on's own window over the editor, like Quaver's plugin windows: dragged by its
 *  title, closed by its ×. */
export default function EditorAddonWindow({ window: shown, onClose }: {
	window: AddonWindow,
	onClose: () => void,
}) {
	const { t } = useLingui();
	const [at, setAt] = useState(() => ({
		x: Math.max(16, innerWidth - shown.width - 340), y: 120,
	}));
	const drag = useRef<{ x: number, y: number }>(undefined);

	const onDown = (e: MouseEvent) => {
		drag.current = {
			x: e.clientX - at.x, y: e.clientY - at.y,
		};
		const move = (m: globalThis.MouseEvent) => {
			const from = drag.current!;
			setAt({
				x: Math.min(innerWidth - 60, Math.max(0, m.clientX - from.x)),
				y: Math.min(innerHeight - 30, Math.max(0, m.clientY - from.y)),
			});
		};
		const up = () => {
			window.removeEventListener('mousemove', move);
			window.removeEventListener('mouseup', up);
		};
		window.addEventListener('mousemove', move);
		window.addEventListener('mouseup', up);
	};

	return (
		<div
			className='editor__addon-window'
			style={{
				left: at.x, top: at.y, width: shown.width, height: shown.height,
			}}
		>
			<div className='editor__addon-window-bar' onMouseDown={onDown}>
				<span>{shown.title}</span>
				<button className='editor__remove' aria-label={t`Close`} onClick={onClose}>×</button>
			</div>
			<EditorAddonMount render={shown.render} className='editor__addon-window-body' />
		</div>
	);
}
