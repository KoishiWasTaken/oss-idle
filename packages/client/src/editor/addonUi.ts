import Synced from '@oss-idle/shared/helpers/synced';

/** Draws an add-on's UI into `container`; what it returns runs when it goes. */
export type AddonRender = (container: HTMLElement) => void | (() => void);

export type AddonTab = { id: string, label: string, render: AddonRender };
export type AddonPanel = { id: string, title?: string, render: AddonRender };
export type AddonWindow = {
	id: number,
	title: string,
	width: number,
	height: number,
	render: AddonRender,
	onClose?: () => void,
};

/** What add-ons put in the editor: tabs in the left panel, panels on the right, windows over it. */
export const addonTabs = new Synced<AddonTab[]>([]);
export const addonPanels = new Synced<AddonPanel[]>([]);
export const addonWindows = new Synced<AddonWindow[]>([]);

/** Add `item` to `list` (in place of one with its id); returns what takes it out. */
export const addTo = <T extends { id: string | number }>(
	list: Synced<T[]>,
	item: T,
): (() => void) => {
	void list.set([...list.get().filter(other => other.id !== item.id), item]);
	return () => void list.set(list.get().filter(other => other !== item));
};
