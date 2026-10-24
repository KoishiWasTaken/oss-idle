import './Marquee.css';
import {
	useEffect,
	useRef,
	type ReactNode,
} from 'react';

// px per second
const SPEED = 30;

type Props = {
	className?: string;
	children: ReactNode;
};

/** One line of text that scrolls back and forth when it doesn't fit. */
export default function Marquee({ className = '', children }: Props) {
	const box = useRef<HTMLDivElement>(null);
	const text = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const outer = box.current;
		const inner = text.current;
		if (!outer || !inner) return;
		const ro = new ResizeObserver(() => {
			const shift = inner.offsetWidth - outer.clientWidth;
			outer.classList.toggle('is-scrolling', shift > 0);
			inner.style.setProperty('--marquee-shift', `${-Math.max(0, shift)}px`);
			// the move is 70% of the cycle, the rest pauses at either end
			inner.style.setProperty('--marquee-duration', `${shift / SPEED / 0.7}s`);
		});
		ro.observe(outer);
		ro.observe(inner);
		return () => ro.disconnect();
	}, []);

	return (
		<div ref={box} className={`marquee ${className}`}>
			<div ref={text} className="marquee__text">{children}</div>
		</div>
	);
}
