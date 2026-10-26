import {
	Addon,
	addonsVersion,
} from '../db/schema/addon';
import { message } from '../globals';
import {
	entryById,
	library,
	onLibraryChanged,
} from '../library';
import type { Addon as AddonDTO } from '../online/addons';
import {
	addonsMoved,
	markAddonsMoved,
	readAddonFile,
	removeAddonFile,
	writeAddonFile,
} from './addonFiles';
import {
	type AddonHost,
	hostFor,
} from './host';

/**
 * Add-on runtime. Add-ons are unsandboxed userscripts: we run them by turning
 * their source into an ES module (via a Blob URL) and importing it in the page
 * realm, so they have full window/DOM access. The contract is the two exports
 * `mount` / `unmount`; `mount` gets the add-on's own metadata and the game's host
 * (its React, the editor: see host.ts).
 *
 * A live add-on's `unmount` is held here so enabling/disabling, updating, or
 * uninstalling can tear it down cleanly without a page reload.
 */

type AddonMeta = Pick<Addon, 'id' | 'name' | 'version' | 'gameVersion' | 'authorId' | 'authorName'>;

type AddonModule = {
	mount?: (addon: AddonMeta, host: AddonHost) => void,
	unmount?: () => void | Promise<void>,
};

/** Loaded add-ons, by add-on id → its `unmount` (if any). */
const live = new Map<number, () => void | Promise<void>>();

/**
 * Import an add-on's source as an ES module (full page access, real exports)
 */
const load = async (source: string): Promise<AddonModule> => {
	const url = URL.createObjectURL(
		new Blob([source], 
			{ type: 'text/javascript' },
		));
	try {
		return await import(/* @vite-ignore */ url) as AddonModule;
	} finally {
		URL.revokeObjectURL(url);
	}
};

/** Import an add-on's source, call `mount`, and remember its `unmount`. */
const start = async ({
	id, name, version, gameVersion, authorId, authorName, source,
}: Addon): Promise<void> => {
	const { host, release } = hostFor();
	try {
		const mod = await load(source);
		mod.mount?.({
			id, name, version, gameVersion, authorId, authorName,
		}, host);
		live.set(id, async () => {
			try {
				await mod.unmount?.();
			} finally {
				release();
			}
		});
	} catch (e) {
		// what it hooked into the editor before failing goes with it
		release();
		console.error(`Add-on "${name}" failed to load`, e);
		message.set(`Add-on "${name}" failed to load`);
	}
};

/** Add-ons still loading, by id: a second mount waits on it rather than loading a twin. */
const loading = new Map<number, Promise<void>>();

/** Run an add-on's source once, even when asked again while it loads. */
const mount = (addon: Addon): Promise<void> => {
	if (live.has(addon.id)) return Promise.resolve();
	let pending = loading.get(addon.id);
	if (!pending) {
		pending = start(addon).finally(() => loading.delete(addon.id));
		loading.set(addon.id, pending);
	}
	return pending;
};

/** Tear down a live add-on (its `unmount`), if running, and wait for it to finish. */
const unmount = async (id: number, name: string): Promise<void> => {
	await loading.get(id);
	const stop = live.get(id);
	if (!stop) return;
	live.delete(id);
	try {
		await stop();
	} catch (e) {
		console.error(`Add-on "${name}" failed to unmount`, e);
	}
	// older SDK builds return nothing and finish their teardown on microtasks
	await new Promise(resolve => setTimeout(resolve));
};

/** Enable an installed add-on: persist the flag and mount it. */
export const enableAddon = async (addon: Addon): Promise<void> => {
	await addon.setEnabled(true);
	await mount(addon);
};

/** Save a catalog add-on locally and enable it. */
export const installAddon = async (dto: AddonDTO): Promise<void> => {
	const installed = await new Addon({
		id: dto.id,
		name: dto.name,
		description: dto.description,
		version: dto.version,
		gameVersion: dto.gameVersion,
		source: dto.source,
		icon: dto.icon,
		authorId: dto.authorId,
		authorName: dto.authorName,
		tags: dto.tags.join(','),
		types: dto.types.join(','),
		status: dto.status,
		enabled: false,
		installedAt: Date.now(),
	}).add();
	await writeAddonFile(installed);
	await enableAddon(installed);
};

/** Disable an installed add-on: persist the flag and unmount it. */
export const disableAddon = async (addon: Addon): Promise<void> => {
	await addon.setEnabled(false);
	await unmount(addon.id, addon.name);
};

/** Uninstall an add-on: unmount (if live) and drop its local row. */
export const uninstallAddon = async (addon: Addon): Promise<void> => {
	await unmount(addon.id, addon.name);
	await addon.uninstall();
	await removeAddonFile(addon.id);
};

/** Swap a running add-on's source after an update: unmount old, mount new. */
export const remountAddon = async (addon: Addon): Promise<void> => {
	await unmount(addon.id, addon.name);
	if (addon.enabled) await mount(addon);
};

/** On desktop the code lives in each add-on's folder: what changed there is taken in (and
 *  runs), and an add-on whose folder went is uninstalled. */
const syncFolders = async (): Promise<void> => {
	const moved = addonsMoved();
	for (const addon of await Addon.getAll()) {
		const entry = await entryById('addons', addon.id);
		if (!entry) {
			if (moved) await uninstallAddon(addon);
			else await writeAddonFile(addon);
			continue;
		}
		const source = await readAddonFile(entry);
		if (source === undefined || source === addon.source) continue;
		await addon.update({ source });
		addonsVersion.set(addonsVersion.get() + 1);
		await remountAddon(addon);
	}
	markAddonsMoved();
};

let queue: Promise<unknown> = Promise.resolve();
const later = (job: () => Promise<void>) => {
	queue = queue.then(job).catch(e => console.error('[add-ons folder]', e));
};

let timer: ReturnType<typeof setTimeout> | undefined;

/** On boot, mount every enabled installed add-on. */
export const bootAddons = async (): Promise<void> => {
	if (library()) {
		later(syncFolders);
		await queue;
		onLibraryChanged('addons', () => {
			clearTimeout(timer);
			// a folder renamed goes and comes back: look once both are in
			timer = setTimeout(() => later(syncFolders), 300);
		});
	}
	const installed = await Addon.getAll();
	await Promise.all(
		installed
			.filter(a => a.enabled)
			.map(mount),
	);
};
