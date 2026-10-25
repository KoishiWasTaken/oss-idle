import type { LibraryEntry } from '@oss-idle/shared/desktop';
import { normalizePath } from '@oss-idle/shared/osuSkin/files';
import { SkinDAO } from '../../db/schema/skin';
import {
	entriesOf,
	entryById,
	idOf,
	onLibraryChanged,
	ownsId,
	readEntryFile,
	writeEntry,
} from '../../library';
import {
	localSkin,
	newLocalId,
	skinInfo,
} from './importSkin';
import { reloadSkin } from './Skin';
import {
	skinsLeftBehind,
	skinsOnDisk,
} from './skinFiles';

/**
 * What the player does in the skins folder (desktop): a skin changed there loads again, a
 * folder the game did not make is a new skin, and a skin whose folder went goes too.
 */

/** A folder the game did not make, installed as a local skin. */
const adopt = async (entry: LibraryEntry): Promise<void> => {
	const ini = entry.files.find(file => normalizePath(file.path) === 'skin.ini');
	const blob = ini && await readEntryFile('skins', entry.name, ini.path);
	const info = await skinInfo(ini && blob ? { [ini.path]: blob } : {});
	const id = newLocalId(await SkinDAO.getAll());
	await writeEntry('skins', entry.name, {}, {
		id, files: entry.files,
	});
	const name = (info.name?.trim() || entry.name).slice(0, 80);
	await localSkin(id, name, info.author?.trim() ?? '').add();
};

const sync = async (): Promise<void> => {
	const rows = await SkinDAO.getAll();
	const installed = new Set(rows.map(skin => skin.id));
	for (const entry of await entriesOf('skins')) {
		const id = idOf(entry);
		if (id !== undefined && installed.has(id) && await ownsId('skins', entry)) continue;
		if (entry.files.length) await adopt(entry);
	}
	// a skin IndexedDB could not move yet has no folder but is still there
	if (await skinsLeftBehind()) return;
	for (const skin of rows) {
		if (!await entryById('skins', skin.id)) await skin.forget();
	}
};

let queue: Promise<unknown> = Promise.resolve();
const later = (job: () => Promise<void>) => {
	queue = queue.then(job).catch(e => console.error('[skins folder]', e));
};

const changed = new Set<number>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** Take in the folders the game does not know, then follow what the player changes. */
export const watchSkinFolders = async (): Promise<void> => {
	if (!await skinsOnDisk()) return;
	onLibraryChanged('skins', change => {
		const id = change.entry && idOf(change.entry);
		if (id !== undefined) changed.add(id);
		clearTimeout(timer);
		// a folder renamed goes and comes back: look once both are in
		timer = setTimeout(() => later(async () => {
			const ids = [...changed];
			changed.clear();
			await sync();
			for (const one of ids) reloadSkin(one);
		}), 300);
	});
	later(sync);
};
