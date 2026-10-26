import {
	type DependencyList,
	useEffect,
	useState,
} from 'react';

import { revokeBlob } from './beatmap_store';

/**
 * A stored file's URL, re-resolved when `deps` change. Each blob URL is freed once
 * the next one is on screen, or on unmount: until then it holds the whole file.
 */
export default function useFileUrl(
	resolve: () => Promise<string | undefined>,
	deps: DependencyList,
): string | undefined {
	const [url, setUrl] = useState<string>();
	useEffect(() => {
		let cancelled = false;
		void resolve().then(next => {
			if (cancelled) revokeBlob(next);
			else setUrl(next);
		});
		return () => { cancelled = true; };
	}, deps);
	useEffect(() => () => revokeBlob(url), [url]);
	return url;
}
