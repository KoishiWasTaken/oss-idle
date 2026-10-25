import { normalizePath } from '@oss-idle/shared/osuSkin/files';
import type { SkinFile } from '@oss-idle/shared/skin';
import type { LibraryEntry } from '@oss-idle/shared/desktop';
import {
	entryById,
	freeName,
	library,
	readEntryFile,
	removeEntry,
	writeEntry,
} from '../../library';

/**
 * Installed skins' files: a manifest per skin (its files as the skin names them, with the
 * server's hash for a catalog skin) and each file's bytes. In IndexedDB, keyed by skin and
 * normalized path; on desktop, a folder each in the skins folder, the manifest in its info.
 */

const DB_NAME = 'skins';
const DB_VERSION = 1;

type Manifest = { id: number, files: SkinFile[] };

let dbPromise: Promise<IDBDatabase> | undefined;
const db = () => dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
	const req = indexedDB.open(DB_NAME, DB_VERSION);
	req.onupgradeneeded = () => {
		req.result.createObjectStore('manifests', { keyPath: 'id' });
		req.result.createObjectStore('files');
	};
	req.onsuccess = () => resolve(req.result);
	req.onerror = () => {
		dbPromise = undefined;
		reject(req.error);
	};
});

const done = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => {
	tx.oncomplete = () => resolve();
	tx.onerror = () => reject(tx.error);
	tx.onabort = () => reject(tx.error);
});

const request = <T>(req: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
	req.onsuccess = () => resolve(req.result);
	req.onerror = () => reject(req.error);
});

const fileKey = (id: number, path: string) => `${id}/${normalizePath(path)}`;

const store = async (name: 'manifests' | 'files') =>
	(await db()).transaction(name).objectStore(name);

const storedManifest = async (id: number) =>
	(await request<Manifest | undefined>((await store('manifests')).get(id)))?.files;

const storedFile = async (id: number, path: string) =>
	request<Blob | undefined>((await store('files')).get(fileKey(id, path)));

/** The skin's files as the folder holds them: the hashes the manifest has for those the
 *  player did not resize. */
const folderManifest = (entry: LibraryEntry): SkinFile[] => {
	const known = new Map(((entry.info as Manifest).files ?? []).map(file => [file.path, file]));
	return entry.files.map(({ path, size }) => {
		const hash = known.get(path)?.size === size ? known.get(path)?.hash : undefined;
		return hash ? {
			path, size, hash,
		} : {
			path, size,
		};
	});
};

const putOnDisk = async (
	id: number, files: SkinFile[], blobs: Map<string, Blob>, name?: string,
): Promise<void> => {
	const entry = await entryById('skins', id);
	const folder = entry?.name ?? await freeName('skins', name ?? String(id));
	const keep = new Set(files.map(f => normalizePath(f.path)));
	const write: Record<string, Blob | undefined> = {};
	for (const old of entry?.files ?? []) {
		if (!keep.has(normalizePath(old.path))) write[old.path] = undefined;
	}
	for (const file of files) {
		const blob = blobs.get(normalizePath(file.path));
		if (blob) write[file.path] = blob;
	}
	await writeEntry('skins', folder, write, {
		id, files,
	} satisfies Manifest);
};

/** The skins IndexedDB held, moved into the skins folder. IndexedDB goes once all moved. */
const moveToDisk = async (): Promise<void> => {
	if (!(await indexedDB.databases()).some(known => known.name === DB_NAME)) return;
	const { SkinDAO } = await import('../../db/schema/skin');
	const names = new Map((await SkinDAO.getAll()).map(skin => [skin.id, skin.name]));
	const manifests = await request<Manifest[]>((await store('manifests')).getAll());
	let failed = false;
	for (const { id, files } of manifests) {
		try {
			if (await entryById('skins', id)) continue;
			const blobs = new Map<string, Blob>();
			for (const file of files) {
				const blob = await storedFile(id, file.path);
				if (blob) blobs.set(normalizePath(file.path), blob);
			}
			await putOnDisk(id, files, blobs, names.get(id));
		} catch (e) {
			failed = true;
			console.error(`[skins] moving skin ${id} to its folder failed`, e);
		}
	}
	if (failed) return;
	(await db()).close();
	dbPromise = undefined;
	indexedDB.deleteDatabase(DB_NAME);
};

let moved: Promise<void> | undefined;

/** Whether skins live in the skins folder (desktop), once IndexedDB's moved there. */
export const skinsOnDisk = async (): Promise<boolean> => {
	if (!library()) return false;
	await (moved ??= moveToDisk());
	return true;
};

/** Whether IndexedDB still holds skins it could not move to their folders. */
export const skinsLeftBehind = async () =>
	(await indexedDB.databases()).some(known => known.name === DB_NAME);

export const getManifest = async (id: number): Promise<SkinFile[] | undefined> => {
	if (!await skinsOnDisk()) return storedManifest(id);
	const entry = await entryById('skins', id);
	return entry && folderManifest(entry);
};

export const getSkinFile = async (id: number, path: string): Promise<Blob | undefined> => {
	if (!await skinsOnDisk()) return storedFile(id, path);
	const entry = await entryById('skins', id);
	const key = normalizePath(path);
	const found = entry?.files.find(file => normalizePath(file.path) === key);
	return found && readEntryFile('skins', entry!.name, found.path);
};

/** Store a skin's files, replacing what it held before. Files already stored under the same
 *  hash are kept as they are, so an update only writes what changed. A new skin's folder is
 *  named `name`. */
export const putSkinFiles = async (
	id: number,
	files: SkinFile[],
	blobs: Map<string, Blob>,
	name?: string,
): Promise<void> => {
	if (await skinsOnDisk()) return putOnDisk(id, files, blobs, name);
	const before = await storedManifest(id) ?? [];
	const tx = (await db()).transaction(['manifests', 'files'], 'readwrite');
	const bytes = tx.objectStore('files');
	const keep = new Set(files.map(f => normalizePath(f.path)));
	for (const old of before) {
		if (!keep.has(normalizePath(old.path))) bytes.delete(fileKey(id, old.path));
	}
	for (const file of files) {
		const blob = blobs.get(normalizePath(file.path));
		if (blob) bytes.put(blob, fileKey(id, file.path));
	}
	tx.objectStore('manifests').put({
		id, files,
	} satisfies Manifest);
	await done(tx);
};

export const deleteSkinFiles = async (id: number): Promise<void> => {
	if (await skinsOnDisk()) {
		const entry = await entryById('skins', id);
		if (entry) await removeEntry('skins', entry.name);
		return;
	}
	const files = await storedManifest(id) ?? [];
	const tx = (await db()).transaction(['manifests', 'files'], 'readwrite');
	for (const file of files) tx.objectStore('files').delete(fileKey(id, file.path));
	tx.objectStore('manifests').delete(id);
	await done(tx);
};

/** Move a skin's files to another id (an imported skin, once published). */
export const moveSkinFiles = async (from: number, to: number): Promise<void> => {
	if (await skinsOnDisk()) {
		const entry = await entryById('skins', from);
		if (entry) await writeEntry('skins', entry.name, {}, {
			id: to, files: folderManifest(entry),
		} satisfies Manifest);
		return;
	}
	const files = await getManifest(from);
	if (!files) return;
	const blobs = new Map<string, Blob>();
	for (const file of files) {
		const blob = await getSkinFile(from, file.path);
		if (blob) blobs.set(normalizePath(file.path), blob);
	}
	await putSkinFiles(to, files, blobs);
	await deleteSkinFiles(from);
};

/** Show the skin's folder in the file explorer (desktop). */
export const revealSkin = async (id: number): Promise<void> => {
	const entry = await skinsOnDisk() && await entryById('skins', id);
	if (entry) await library()!.reveal('skins', entry.name);
};
