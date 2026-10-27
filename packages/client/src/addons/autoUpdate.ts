import compareVersions from '@oss-idle/shared/helpers/compareVersions';

import { Addon } from '../db/schema/addon';
import {
	type Addon as AddonDTO,
	addonVersions,
	getAddon,
} from '../online/addons';
import {
	allowsUpdate,
	applyAddonUpdate,
} from './runtime';

const CHECK_EVERY = 60_000;
/** How soon an add-on that held its update is asked again. */
const RETRY_EVERY = 5_000;

/** Published versions fetched but not taken in yet (their add-on held them), by id. */
const pending = new Map<number, AddonDTO>();

const check = async () => {
	const auto = (await Addon.getAll()).filter(a => a.autoUpdate);
	if (!auto.length) return;
	const latest = await addonVersions(auto.map(a => a.id));
	for (const a of auto) {
		const version = latest[a.id];
		if (version === undefined || compareVersions(version, a.version) <= 0) continue;
		if (pending.get(a.id)?.version !== version) pending.set(a.id, await getAddon(a.id));
	}
};

const apply = async () => {
	for (const [id, remote] of pending) {
		const local = await Addon.get(id);
		if (!local?.autoUpdate || compareVersions(remote.version, local.version) <= 0) {
			pending.delete(id);
			continue;
		}
		if (!await allowsUpdate(id)) continue;
		pending.delete(id);
		await applyAddonUpdate(local, remote);
	}
};

let busy = false;
let lastCheck = -Infinity;
const tick = async () => {
	if (busy) return;
	busy = true;
	try {
		if (Date.now() - lastCheck >= CHECK_EVERY) {
			lastCheck = Date.now();
			await check();
		}
		await apply();
	} catch (e) {
		console.error('[add-on auto-update]', e);
	} finally {
		busy = false;
	}
};

/** Polls for new versions of the add-ons set to auto-update, and restarts each into its new
 *  version as soon as it lets go (its `canUpdate`). */
export const startAutoUpdates = () => {
	void tick();
	setInterval(() => void tick(), RETRY_EVERY);
};
