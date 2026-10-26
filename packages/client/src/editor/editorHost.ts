import {
	type Disposer,
	Owned,
} from '../addons/owned';
import type { EditorApi } from './editorApi';

/** Makes the open editor's API for one add-on, its registrations kept in `owned`. */
type MakeApi = (owned: Owned) => EditorApi;
type Watcher = { onOpen: (editor: EditorApi) => void, onClose?: () => void, owned?: Owned };

let open: MakeApi | undefined;
const watchers = new Set<Watcher>();

/** An add-on's own code: what it throws stays with it. */
const safely = (run: () => void) => {
	try {
		run();
	} catch (e) {
		console.error('[addons] editor add-on failed', e);
	}
};

const start = (watcher: Watcher) => {
	if (!open) return;
	const make = open;
	watcher.owned = new Owned();
	const owned = watcher.owned;
	safely(() => watcher.onOpen(make(owned)));
};

const stop = (watcher: Watcher) => {
	if (!watcher.owned) return;
	watcher.owned.release();
	watcher.owned = undefined;
	if (watcher.onClose) safely(watcher.onClose);
};

/** The editor opened (EditorView): every watching add-on gets its API. */
export const editorOpened = (make: MakeApi): void => {
	open = make;
	for (const watcher of watchers) start(watcher);
};

/** The editor closed: what add-ons put in it goes. */
export const editorClosed = (): void => {
	for (const watcher of watchers) stop(watcher);
	open = undefined;
};

/** How add-ons reach the editor: told when it opens (now, if it is open) and closes. */
export type EditorHost = {
	watch(onOpen: (editor: EditorApi) => void, onClose?: () => void): Disposer,
};

export const editorHost: EditorHost = {
	watch: (onOpen, onClose) => {
		const watcher: Watcher = {
			onOpen, onClose,
		};
		watchers.add(watcher);
		start(watcher);
		return () => {
			watchers.delete(watcher);
			stop(watcher);
		};
	},
};
