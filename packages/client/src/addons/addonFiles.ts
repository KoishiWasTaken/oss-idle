import { strToU8 } from 'fflate';
import type { LibraryEntry } from '@oss-idle/shared/desktop';
import type { Addon } from '../db/schema/addon';
import {
	entryById,
	freeName,
	library,
	readEntryFile,
	removeEntry,
	writeEntry,
} from '../library';

/**
 * Installed add-ons' code on disk (desktop): a folder each in the add-ons folder, the code in
 * its `addon.js`. The installed row keeps a copy, the one that runs.
 */

export const ADDON_FILE = 'addon.js';

/** Once the rows' code has been put in folders, a row without one was deleted there. */
const MOVED_KEY = 'addons.onDisk';

export const addonsMoved = () => {
	try {
		return localStorage.getItem(MOVED_KEY) === '1';
	} catch {
		return false;
	}
};

export const markAddonsMoved = () => {
	try {
		localStorage.setItem(MOVED_KEY, '1');
	} catch { /* moved again next time: harmless */ }
};

export const writeAddonFile = async (addon: Addon): Promise<void> => {
	if (!library()) return;
	const name = (await entryById('addons', addon.id))?.name ?? await freeName('addons', addon.name);
	await writeEntry('addons', name, { [ADDON_FILE]: strToU8(addon.source) }, { id: addon.id });
};

export const removeAddonFile = async (id: number): Promise<void> => {
	const entry = library() && await entryById('addons', id);
	if (entry) await removeEntry('addons', entry.name);
};

export const readAddonFile = async (entry: LibraryEntry): Promise<string | undefined> =>
	(await readEntryFile('addons', entry.name, ADDON_FILE))?.text();
