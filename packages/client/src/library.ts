import {
	desktop,
	type LibraryChange,
	type LibraryEntry,
	type LibraryFiles,
	type LibraryKind,
} from '@oss-idle/shared/desktop';

/**
 * Maps, skins and add-ons as folders on disk, in the desktop app; undefined in a browser,
 * where they stay in IndexedDB. Each kind's folders are listed once and kept current here,
 * from the game's own writes and from what the player changes.
 */
export const library = () => desktop()?.library;

const shelves = new Map<LibraryKind, Promise<Map<string, LibraryEntry>>>();
/** each kind's folders by the id the game wrote in them */
const indexes = new Map<LibraryKind, Map<number, LibraryEntry>>();
const listeners = new Set<(change: LibraryChange) => void>();

const shelf = (kind: LibraryKind) => {
	let found = shelves.get(kind);
	if (!found) {
		found = library()!.list(kind).then(list => new Map(list.map(entry => [entry.name, entry])));
		shelves.set(kind, found);
	}
	return found;
};

/** The id the game wrote in a folder's info. */
export const idOf = (entry: LibraryEntry): number | undefined => {
	const id = (entry.info as { id?: unknown } | undefined)?.id;
	return typeof id === 'number' ? id : undefined;
};

export const entriesOf = async (kind: LibraryKind) => [...(await shelf(kind)).values()];

/** The folder holding `id`: the first listed, when copies of a folder share it. */
export const entryById = async (
	kind: LibraryKind, id: number,
): Promise<LibraryEntry | undefined> => {
	let index = indexes.get(kind);
	if (!index) {
		index = new Map();
		for (const entry of (await shelf(kind)).values()) {
			const own = idOf(entry);
			if (own !== undefined && !index.has(own)) index.set(own, entry);
		}
		indexes.set(kind, index);
	}
	return index.get(id);
};

/** Whether `entry` is the folder the game knows its id by (not a copy of one). */
export const ownsId = async (kind: LibraryKind, entry: LibraryEntry) => {
	const id = idOf(entry);
	return id !== undefined && (await entryById(kind, id))?.name === entry.name;
};

const changed = async (kind: LibraryKind, name: string, entry?: LibraryEntry) => {
	const entries = await shelf(kind);
	if (entry) entries.set(name, entry);
	else entries.delete(name);
	indexes.delete(kind);
};

export const writeEntry = async (
	kind: LibraryKind,
	name: string,
	files: Record<string, Blob | Uint8Array | undefined>,
	info?: unknown,
	replace = false,
): Promise<LibraryEntry> => {
	const bytes: LibraryFiles = {};
	for (const [path, data] of Object.entries(files)) {
		bytes[path] = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
	}
	const written = await library()!.write(kind, name, bytes, info, replace);
	await changed(kind, name, written);
	return written;
};

export const removeEntry = async (kind: LibraryKind, name: string): Promise<void> => {
	await library()!.remove(kind, name);
	await changed(kind, name);
};

export const readEntryFile = async (
	kind: LibraryKind, name: string, path: string, type?: string,
): Promise<Blob | undefined> => {
	const data = await library()!.read(kind, name, path);
	return data && new Blob([data as Uint8Array<ArrayBuffer>], { type });
};

/** A folder name Windows takes and no folder of `kind` has yet. */
export const freeName = async (kind: LibraryKind, wanted: string): Promise<string> => {
	const base = wanted
		.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
		.slice(0, 80)
		.replace(/^[. ]+|[. ]+$/g, '') || kind;
	const taken = new Set([...(await shelf(kind)).keys()].map(name => name.toLowerCase()));
	for (let n = 1; ; n++) {
		const name = n === 1 ? base : `${base} (${n})`;
		if (!taken.has(name.toLowerCase())) return name;
	}
};

/** What the player changes in `kind`'s folders; returns an unsubscribe fn. */
export const onLibraryChanged = (kind: LibraryKind, cb: (change: LibraryChange) => void) => {
	const listener = (change: LibraryChange) => {
		if (change.kind === kind) cb(change);
	};
	listeners.add(listener);
	return () => { listeners.delete(listener); };
};

library()?.onChanged(change => void (async () => {
	await changed(change.kind, change.name, change.entry);
	for (const cb of listeners) cb(change);
})());
