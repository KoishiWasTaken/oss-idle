import {
	shell,
	type WebContents,
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The editor's map as a folder on disk, open in the file explorer: the game writes the
 * set's files there, and what the player adds, changes or deletes there is sent back.
 * One folder at a time.
 */

export type SetFiles = Record<string, Uint8Array | undefined>;

let open: {
	folder: string,
	sender: WebContents,
	watcher: fs.FSWatcher,
	/** each file's last modified time, as written or last seen: a change is any other */
	known: Map<string, number>,
	timer?: NodeJS.Timeout,
} | undefined;

/** The last folder closed and what was known of it, for coming back to it. */
let kept: { folder: string, known: Map<string, number> } | undefined;

/** A folder name Windows takes. */
const folderName = (name: string) =>
	name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '').slice(0, 120) || 'map';

/** `name` (a path in the set) inside `folder`, or undefined when it would land outside. */
const inside = (folder: string, name: string) => {
	const full = path.resolve(folder, name);
	return full.startsWith(folder + path.sep) ? full : undefined;
};

/** Every file in `folder`, by its path in the set. */
const listFiles = (folder: string): string[] =>
	fs.readdirSync(folder, {
		recursive: true, withFileTypes: true, 
	})
		.filter(entry => entry.isFile())
		.map(entry => path.relative(folder, path.join(entry.parentPath, entry.name)))
		.map(name => name.split(path.sep).join('/'));

const write = (files: SetFiles) => {
	if (!open) return;
	for (const [name, data] of Object.entries(files)) {
		const full = inside(open.folder, name);
		if (!full) continue;
		try {
			if (data) {
				fs.mkdirSync(path.dirname(full), { recursive: true });
				fs.writeFileSync(full, data);
				open.known.set(name, fs.statSync(full).mtimeMs);
			} else {
				fs.rmSync(full, { force: true });
				open.known.delete(name);
			}
		} catch (e) {
			// a file another program holds: the next write or change brings it level
			console.warn('[map folder] could not write', name, e);
		}
	}
};

/** What changed in the folder since it was last looked at, sent to the game. */
const scan = (): SetFiles => {
	if (!open) return {};
	const { folder, known, sender } = open;
	const changed: SetFiles = {};
	let present: Set<string>;
	try {
		present = new Set(listFiles(folder));
	} catch {
		// the folder itself went (deleted, renamed): nothing more to watch
		closeMapFolder();
		return {};
	}
	for (const name of present) {
		try {
			const modified = fs.statSync(path.join(folder, name)).mtimeMs;
			if (known.get(name) === modified) continue;
			changed[name] = fs.readFileSync(path.join(folder, name));
			known.set(name, modified);
		} catch {
			// still being written, or held by another program: looked at again next change
		}
	}
	for (const name of [...known.keys()]) {
		if (present.has(name)) continue;
		known.delete(name);
		changed[name] = undefined;
	}
	if (Object.keys(changed).length && !sender.isDestroyed()) {
		sender.send('oss-idle:map-folder-changed', changed);
	}
	return changed;
};

export const closeMapFolder = () => {
	if (!open) return;
	clearTimeout(open.timer);
	open.watcher.close();
	kept = {
		folder: open.folder, known: open.known,
	};
	open = undefined;
};

/** The set's `files` written to `<root>/maps/<name>`, watched, and opened unless `show` is off.
 *  Files the player left there while it wasn't watched are taken in, never deleted. */
export const openMapFolder = async (
	root: string,
	sender: WebContents,
	name: string,
	files: SetFiles,
	show = true,
): Promise<void> => {
	closeMapFolder();
	const folder = path.join(root, 'maps', folderName(name));
	fs.mkdirSync(folder, { recursive: true });
	const watcher = fs.watch(folder, { recursive: true }, () => {
		if (!open) return;
		clearTimeout(open.timer);
		// a file being saved fires several events: look once they settle
		open.timer = setTimeout(scan, 400);
	});
	watcher.on('error', () => closeMapFolder());
	const known = kept?.folder === folder ? kept.known : undefined;
	open = {
		folder, sender, watcher, known: known ?? new Map(),
	};
	if (known) {
		// back to it (after a test play): what the player changed meanwhile wins, but for
		// the charts, which the editor holds
		const changed = scan();
		write(Object.fromEntries(Object.entries(files)
			.filter(([name]) => !(name in changed) || /\.(osu|oss)$/i.test(name))));
	} else {
		write(files);
		// what is there besides the set's own files comes in now
		scan();
	}
	if (!show) return;
	const failed = await shell.openPath(folder);
	if (failed) console.warn('[map folder] could not open', folder, failed);
};

export const writeMapFolder = (files: SetFiles) => write(files);
