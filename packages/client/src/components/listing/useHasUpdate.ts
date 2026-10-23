import {
	useEffect,
	useState,
} from 'react';
import compareVersions from '@oss-idle/shared/helpers/compareVersions';

type Item = { id: number, version: string };

/**
 * Looks up the latest published version of each installed add-on or skin (best
 * effort: a 404, unpublished or removed, just has no update) and tells which
 * ones are behind.
 */
export const useHasUpdate = (
	installed: Item[],
	get: (id: number) => Promise<{ version: string }>,
) => {
	const [latest, setLatest] = useState<Record<number, string>>({});
	useEffect(() => {
		void Promise.all(installed.map(a =>
			get(a.id).then(d => [a.id, d.version] as const).catch(() => undefined),
		)).then(pairs => {
			const existing = pairs.filter(Boolean) as [number, string][];
			setLatest(Object.fromEntries(existing));
		});
	}, [installed]);
	return (a: Item) => latest[a.id] !== undefined && compareVersions(latest[a.id], a.version) > 0;
};
