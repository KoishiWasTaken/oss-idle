import { shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line object-curly-newline -- false positive from the import attribute
import type {
	LibraryChange,
	LibraryEntry,
	LibraryFiles,
	LibraryKind,
} from '@oss-idle/shared/desktop' with { 'resolution-mode': 'import' };

/**
 * The player's maps, skins and add-ons on disk: `<userData>/<kind>/<folder>/`, with the
 * game's notes on each folder in its `.oss-idle.json`. Held in memory once listed. What the
 * player changes there is sent to the game; the game's own writes are not.
 */

const INFO = '.oss-idle.json';
const KINDS: readonly LibraryKind[] = ['maps', 'skins', 'addons'];

type Scanned = {
	entry: LibraryEntry,
	/** each file's size and modified time, the info file's too: a change is any other */
	stamps: Map<string, string>,
};

type Shelf = {
	dir: string,
	entries: Map<string, Scanned>,
	dirty: Set<string>,
	timer?: NodeJS.Timeout,
};

let root = '';
let send: (change: LibraryChange) => void = () => undefined;
const shelves = new Map<LibraryKind, Shelf>();

export const initLibrary = (userData: string, onChange: (change: LibraryChange) => void) => {
	root = userData;
	send = onChange;
};

const hidden = (name: string) => name.startsWith('.');

/** Every file under `dir` but hidden ones, by its path there. */
const walk = (dir: string, prefix = ''): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
		if (hidden(item.name)) return [];
		if (item.isDirectory()) return walk(path.join(dir, item.name), `${prefix}${item.name}/`);
		return item.isFile() || item.isSymbolicLink() ? [`${prefix}${item.name}`] : [];
	});

const folders = (dir: string) => fs.readdirSync(dir, { withFileTypes: true })
	.filter(item => item.isDirectory() && !hidden(item.name))
	.map(item => item.name);

const readInfo = (dir: string): unknown => {
	try {
		return JSON.parse(fs.readFileSync(path.join(dir, INFO), 'utf8'));
	} catch {
		return undefined;
	}
};

const stamp = (file: string) => {
	const stat = fs.statSync(file, { throwIfNoEntry: false });
	return stat?.isFile() ? stat : undefined;
};

const scan = (dir: string, name: string): Scanned | undefined => {
	let paths: string[];
	try {
		paths = walk(dir);
	} catch {
		return undefined;
	}
	const files: LibraryEntry['files'] = [];
	const stamps = new Map<string, string>();
	for (const file of [...paths, INFO]) {
		const stat = stamp(path.join(dir, file));
		if (!stat) continue;
		stamps.set(file, `${stat.size}:${stat.mtimeMs}`);
		if (file !== INFO) files.push({
			path: file, size: stat.size,
		});
	}
	return {
		entry: {
			name, info: readInfo(dir), files,
		},
		stamps,
	};
};

const differ = (a = new Map<string, string>(), b = new Map<string, string>()) =>
	[...new Set([...a.keys(), ...b.keys()])].filter(file => a.get(file) !== b.get(file));

/** Look again at the folders something happened in, and tell the game what changed. */
const settle = (kind: LibraryKind, shelf: Shelf) => {
	const names = [...shelf.dirty];
	shelf.dirty.clear();
	for (const name of names) {
		const before = shelf.entries.get(name);
		const now = scan(path.join(shelf.dir, name), name);
		const changed = differ(before?.stamps, now?.stamps);
		if (!changed.length && !before === !now) continue;
		if (now) shelf.entries.set(name, now);
		else shelf.entries.delete(name);
		send({
			kind, name, entry: now?.entry, changed: changed.filter(file => file !== INFO),
		});
	}
};

const watch = (kind: LibraryKind, shelf: Shelf) => {
	const watcher = fs.watch(shelf.dir, { recursive: true }, (_event, file) => {
		const name = file?.toString().split(/[\\/]/)[0];
		if (name && hidden(name)) return;
		const names = name ? [name] : [...shelf.entries.keys(), ...folders(shelf.dir)];
		for (const one of names) shelf.dirty.add(one);
		clearTimeout(shelf.timer);
		// a file being saved fires several events: look once they settle
		shelf.timer = setTimeout(() => settle(kind, shelf), 400);
	});
	watcher.on('error', e => console.error(`[library] watching ${kind} failed`, e));
};

const shelfOf = (kind: LibraryKind): Shelf => {
	if (!KINDS.includes(kind)) throw new Error(`no library ${String(kind)}`);
	const known = shelves.get(kind);
	if (known) return known;
	const dir = path.join(root, kind);
	fs.mkdirSync(dir, { recursive: true });
	const shelf: Shelf = {
		dir, entries: new Map(), dirty: new Set(),
	};
	for (const name of folders(dir)) {
		const scanned = scan(path.join(dir, name), name);
		if (scanned) shelf.entries.set(name, scanned);
	}
	watch(kind, shelf);
	shelves.set(kind, shelf);
	return shelf;
};

const folderOf = (shelf: Shelf, name: string) => {
	if (!name || name !== path.basename(name) || hidden(name)) throw new Error(`bad folder ${name}`);
	return path.join(shelf.dir, name);
};

/** `file` (a path in the folder) inside `dir`, or undefined when it would land outside. */
const inside = (dir: string, file: string) => {
	const full = path.resolve(dir, file);
	return full.startsWith(dir + path.sep) && !file.split('/').some(hidden) ? full : undefined;
};

const sameBytes = (file: string, data: Uint8Array) =>
	stamp(file)?.size === data.byteLength && Buffer.from(data).equals(fs.readFileSync(file));

export const listLibrary = (kind: LibraryKind): LibraryEntry[] =>
	[...shelfOf(kind).entries.values()].map(scanned => scanned.entry);

export const readLibrary = (
	kind: LibraryKind, name: string, file: string,
): Uint8Array | undefined => {
	const full = inside(folderOf(shelfOf(kind), name), file);
	try {
		return full ? fs.readFileSync(full) : undefined;
	} catch {
		return undefined;
	}
};

export const writeLibrary = (
	kind: LibraryKind, name: string, files: LibraryFiles, info?: unknown, replace = false,
): LibraryEntry | undefined => {
	const shelf = shelfOf(kind);
	const dir = folderOf(shelf, name);
	fs.mkdirSync(dir, { recursive: true });
	if (replace) {
		for (const file of walk(dir)) {
			if (!(file in files)) fs.rmSync(path.join(dir, file), { force: true });
		}
	}
	for (const [file, data] of Object.entries(files)) {
		const full = inside(dir, file);
		if (!full) continue;
		if (!data) fs.rmSync(full, { force: true });
		else if (!sameBytes(full, data)) {
			fs.mkdirSync(path.dirname(full), { recursive: true });
			fs.writeFileSync(full, data);
		}
	}
	if (info !== undefined) {
		fs.writeFileSync(path.join(dir, INFO), JSON.stringify(info, undefined, '\t'));
	}
	const now = scan(dir, name);
	if (now) shelf.entries.set(name, now);
	return now?.entry;
};

export const removeLibrary = (kind: LibraryKind, name: string): void => {
	const shelf = shelfOf(kind);
	fs.rmSync(folderOf(shelf, name), {
		recursive: true, force: true,
	});
	shelf.entries.delete(name);
};

export const revealLibrary = async (kind: LibraryKind, name?: string): Promise<void> => {
	const shelf = shelfOf(kind);
	const failed = await shell.openPath(name ? folderOf(shelf, name) : shelf.dir);
	if (failed) console.warn('[library] could not open', kind, name, failed);
};
