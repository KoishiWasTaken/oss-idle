import {
	useEffect,
	useState,
} from 'react';

const HEADINGS = '.docs__content h1[id], .docs__content h2[id]';

/** The heading the reader is in: the last one scrolled past the top. */
const currentHeading = () => {
	const headings = [...document.querySelectorAll<HTMLElement>(HEADINGS)];
	const passed = headings.filter(h => h.getBoundingClientRect().top < 100);
	return (passed[passed.length - 1] ?? headings[0])?.id;
};

/** The docs heading in view, followed as the page scrolls (and on `again` changing);
 *  a link's #hash is scrolled to first. */
export const useActiveHeading = (again?: unknown): string | undefined => {
	const [active, setActive] = useState<string>();
	useEffect(() => {
		let frame = 0;
		const spy = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => setActive(currentHeading()));
		};
		spy();
		window.addEventListener('scroll', spy, { passive: true });
		if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
		return () => window.removeEventListener('scroll', spy);
	}, []);
	useEffect(() => setActive(currentHeading()), [again]);
	return active;
};

/** Scroll to heading `id`, its #hash in the address. */
export const goToHeading = (id: string) => {
	document.getElementById(id)?.scrollIntoView();
	history.replaceState(history.state, '', `#${id}`);
};
