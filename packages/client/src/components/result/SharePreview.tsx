import {
	useEffect,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import './SharePreview.css';

const SHOWN_MS = 2600;
const FADE_MS = 300;

/** The flash of a share, then the captured image for a moment. Click to dismiss. */
export default function SharePreview({ canvas, onDone }: {
	canvas?: HTMLCanvasElement,
	onDone: () => void,
}) {
	const [leaving, setLeaving] = useState(false);
	const frame = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!canvas) return;
		canvas.className = 'share-preview__image';
		canvas.onclick = () => setLeaving(true);
		frame.current?.replaceChildren(canvas);
		const leave = setTimeout(() => setLeaving(true), SHOWN_MS);
		return () => clearTimeout(leave);
	}, [canvas]);

	useEffect(() => {
		if (!leaving) return;
		const done = setTimeout(onDone, FADE_MS);
		return () => clearTimeout(done);
	}, [leaving]);

	return createPortal(<div className={`share-preview ${leaving ? 'is-leaving' : ''}`}>
		<div className="share-preview__flash" />
		<div className="share-preview__frame" ref={frame} />
	</div>, document.body);
}
