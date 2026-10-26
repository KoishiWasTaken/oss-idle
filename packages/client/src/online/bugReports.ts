import { t } from '@lingui/core/macro';

import {
	BUG_SETUP_CHANNEL,
	BUG_SETUP_MAX,
} from '@oss-idle/shared/bugs';
import Log, { POPUP_TYPE } from '@oss-idle/shared/helpers/log';

import { Addon } from '../db/schema/addon';
import { installedSkins } from '../db/schema/skin';
import { SETTINGS } from '../db/settings';
import {
	isOptionsOpen,
	isWebOpen,
	webUrl,
} from '../globals';
import { currentSkinDAO } from '../osu/skin/Skin';
import { selectedRuleset } from '../rulesets/registry';
import Socket from './socket';

/** A report on the site, or the form for a new one. */
export const openBugReport = (id?: number) => {
	isOptionsOpen.set(false);
	void webUrl.set(id ? `bugs/${id}` : 'bugs/new');
	void isWebOpen.set(true);
};

Socket.on('bug:reply', ({ id, title }) => Log.popup(
	t`The team answered your bug report: ${title}`,
	POPUP_TYPE.neutral,
	false,
	() => openBugReport(id),
));

const named = (item?: { id: number, name: string, version: string }) =>
	item ? `${item.name} ${item.version} #${item.id}` : 'default';

/** The ruleset, add-ons and skins a bug report goes with, for the team. */
const setup = async () => {
	const editorSkin = installedSkins.get().find(s => s.id === SETTINGS.editorSkin.get());
	const addons = (await Addon.getAll()).map(a => `${named(a)} (${a.enabled ? 'on' : 'off'})`);
	return [
		`ruleset: ${selectedRuleset.get()}`,
		`skin: ${named(currentSkinDAO.get())}`,
		`editor skin: ${named(editorSkin)}`,
		`add-ons: ${addons.join(', ') || 'none'}`,
	].join(' · ').slice(0, BUG_SETUP_MAX);
};

const setupChannel = new BroadcastChannel(BUG_SETUP_CHANNEL);
setupChannel.onmessage = () => void setup().then(s => setupChannel.postMessage(s));
