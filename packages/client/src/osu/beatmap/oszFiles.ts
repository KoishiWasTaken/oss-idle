import type { Unzipped } from 'fflate';

/** An archive's files as an .osz has them: without macOS's extra copies, and out of the one
 *  folder a hand-zipped set often wraps them in (its .osu files name their audio from the root). */
export const asSet = (files: Unzipped): Unzipped => {
	const kept = Object.entries(files).filter(([name]) =>
		!name.startsWith('__MACOSX/') && !name.split('/').pop()!.startsWith('._') && !name.endsWith('/'));
	const tops = new Set(kept.map(([name]) => name.split('/')[0]));
	const wrapped = tops.size === 1 && kept.every(([name]) => name.includes('/'));
	return Object.fromEntries(kept.map(([name, data]) =>
		[wrapped ? name.slice(name.indexOf('/') + 1) : name, data]));
};
