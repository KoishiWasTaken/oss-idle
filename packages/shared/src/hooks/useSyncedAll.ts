import {
	type DependencyList,
	useEffect,
	useReducer,
} from 'react';

import type Synced from '../helpers/synced.js';

/** Re-render when any of the Synced `list()` returns changes; the list is rebuilt when `deps` change. */
export const useSyncedAll = <T>(list: () => Synced<T>[], deps: DependencyList) => {
	const [, refresh] = useReducer((n: number) => n + 1, 0);
	useEffect(() => {
		const synceds = list();
		synceds.forEach(s => s.sync(refresh));
		return () => synceds.forEach(s => s.desync(refresh));
	}, deps);
};
