import {
	useEffect,
	useRef,
} from 'react';
import type { AddonRender } from './addonUi';

/** Where an add-on draws: its `render` runs on an element of its own, its cleanup when it goes. */
export default function EditorAddonMount({ render, className }: {
	render: AddonRender,
	className?: string,
}) {
	const host = useRef<HTMLDivElement>(null);
	useEffect(() => {
		// an element per run: a React root an add-on unmounts late empties only its own
		const element = document.createElement('div');
		host.current!.append(element);
		let cleanup: void | (() => void);
		try {
			cleanup = render(element);
		} catch (e) {
			console.error('[addon] render failed', e);
		}
		return () => {
			try {
				cleanup?.();
			} catch (e) {
				console.error('[addon] cleanup failed', e);
			}
			element.remove();
		};
	}, [render]);
	return <div ref={host} className={className} />;
}
