import {
	idOf,
	onLibraryChanged,
} from '../../library';

/**
 * Card covers: each background baked once to a small JPEG kept in IndexedDB, the most
 * recently shown held in memory as blob URLs. A catalog map's cover comes baked by the
 * server and is kept as is; only a map without one is baked here. A set's covers are
 * rebaked when it is stored again (import, editor, download) or its folder changes on disk.
 */

const WIDTH = 800;
// ponytail: a cover evicted while still on screen loses its URL; raise if a view shows this many
const HELD = 400;
const BAKING = 2;

export type Thumbnail = { url?: string; ready: Promise<string | undefined> };

let dbPromise: Promise<IDBDatabase> | undefined;
const db = () => dbPromise ??= new Promise((resolve, reject) => {
	const req = indexedDB.open('thumbnails', 1);
	req.onupgradeneeded = () => req.result.createObjectStore('covers');
	req.onsuccess = () => resolve(req.result);
	req.onerror = () => reject(req.error);
});

const request = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
	const d = await db();
	return new Promise<T>((resolve, reject) => {
		const r = fn(d.transaction('covers', mode).objectStore('covers'));
		r.onsuccess = () => resolve(r.result);
		r.onerror = () => reject(r.error);
	});
};

// newest first, so the cards on screen bake before the ones scrolled past
const waiting: (() => void)[] = [];
let baking = 0;
const next = () => {
	while (baking < BAKING && waiting.length) {
		baking++;
		waiting.pop()!();
	}
};
const queued = async <T>(work: () => Promise<T>): Promise<T> => {
	await new Promise<void>(go => { waiting.push(go); next(); });
	try {
		return await work();
	} finally {
		baking--;
		next();
	}
};

const bake = async (source: () => Promise<Blob | undefined>): Promise<Blob | undefined> => {
	const blob = await source();
	if (!blob) return undefined;
	const image = await createImageBitmap(blob, {
		resizeWidth: WIDTH, resizeQuality: 'high', 
	});
	const canvas = new OffscreenCanvas(image.width, image.height);
	canvas.getContext('2d')!.drawImage(image, 0, 0);
	image.close();
	return canvas.convertToBlob({
		type: 'image/jpeg', quality: 0.85, 
	});
};

const load = async (
	key: string,
	source: () => Promise<Blob | undefined>,
	ready?: () => Promise<Blob | undefined>,
) => {
	const stored = await request<Blob | undefined>('readonly', s => s.get(key)).catch(() => undefined);
	if (stored) return stored;
	const baked = await ready?.().catch(() => undefined) ?? await queued(() => bake(source));
	if (baked) await request('readwrite', s => s.put(baked, key)).catch(() => undefined);
	return baked;
};

const held = new Map<string, Thumbnail>();

const drop = (key: string) => {
	const thumb = held.get(key);
	held.delete(key);
	void thumb?.ready.then(url => url && URL.revokeObjectURL(url));
};

/** The cover baked from `source`, by `key`: its URL at once when held, else once ready.
 *  `ready` gives one already baked (the server's), kept as is when it has one. */
export const thumbnail = (
	key: string,
	source: () => Promise<Blob | undefined>,
	ready?: () => Promise<Blob | undefined>,
): Thumbnail => {
	let thumb = held.get(key);
	if (thumb) held.delete(key);
	else {
		const made: Thumbnail = {
			ready: load(key, source, ready)
				.then(blob => blob && (made.url = URL.createObjectURL(blob)))
				.catch(() => undefined),
		};
		// a failed fetch (offline) tries again next time
		void made.ready.then(url => { if (!url && held.get(key) === made) held.delete(key); });
		thumb = made;
	}
	held.set(key, thumb);
	if (held.size > HELD) drop(held.keys().next().value!);
	return thumb;
};

/** Key of a stored set's cover: `${setId}/<file>`. */
export const setThumbnailKey = (setId: number, file: string) => `${setId}/${file}`;

/** Rebake a stored set's covers, or every cover without `setId`. */
export const forgetThumbnails = async (setId?: number) => {
	const prefix = setId === undefined ? '' : setThumbnailKey(setId, '');
	for (const key of [...held.keys()]) if (key.startsWith(prefix)) drop(key);
	await request('readwrite', s => setId === undefined ? s.clear()
		: s.delete(IDBKeyRange.bound(prefix, `${prefix}￿`))).catch(() => undefined);
};

onLibraryChanged('maps', change => {
	const id = change.entry && idOf(change.entry);
	if (id !== undefined) void forgetThumbnails(id);
});
