import type {
	ChartDoc,
	Metadata,
	Note,
	TimingPoint,
} from '@oss-idle/shared/editor/chart';
import {
	registerAction,
	type EditorCommands,
} from './actions';
import {
	addonPanels,
	addonTabs,
	addonWindows,
	addTo,
	type AddonRender,
} from './addonUi';
import type EditorSession from './session';
import type {
	Disposer,
	Owned,
} from './editorHost';

/** A change to the chart, made as one undoable edit. */
export type ChartChange = Partial<Pick<ChartDoc, 'notes' | 'timing' | 'scroll' | 'bookmarks'>> & {
	metadata?: Partial<Metadata>,
};

/**
 * The open editor, as an add-on of the Editor type sees it. Notes and points are
 * the editor's own objects: read them, never change them, and hand new ones to
 * `edit`. Everything an add-on registers here goes when the editor closes or the
 * add-on stops.
 */
export type EditorApi = {
	/** columns */
	readonly keys: number,
	notes(): readonly Note[],
	/** BPM points */
	timing(): readonly TimingPoint[],
	/** scroll speed (SV) points */
	scroll(): readonly TimingPoint[],
	metadata(): Readonly<Metadata>,
	bookmarks(): readonly number[],
	/** the .osu text as it stands, saved or not */
	text(): string,
	/** Change the chart in one undoable step, `select` selected after it. */
	edit(change: ChartChange, select?: Note[]): void,
	undo(): void,
	redo(): void,
	save(): void,
	selection(): Note[],
	select(notes: Note[]): void,
	/** the song's time, ms */
	now(): number,
	seek(ms: number): void,
	play(): void,
	pause(): void,
	isPlaying(): boolean,
	/** `ms` on the nearest beat line of the current snap */
	snap(ms: number): number,
	/** the beat snap: 4 for 1/4 */
	divisor(): number,
	setDivisor(divisor: number): void,
	/** Called after every edit, undo, selection or view change. */
	onChange(callback: () => void): Disposer,
	/** An entry in Ctrl+K (under Add-ons), with keys the player can rebind. */
	addAction(action: { id: string, label: string, keys?: string[], run: () => void }): Disposer,
	/** A tab beside Compose, Timing and the rest. */
	addTab(tab: { id: string, label: string, render: AddonRender }): Disposer,
	/** A panel at the foot of the right column. */
	addPanel(panel: { id: string, title?: string, render: AddonRender }): Disposer,
	/** A window over the editor the player can move and close: an add-on's own place. */
	openWindow(window: {
		title: string, width?: number, height?: number, render: AddonRender, onClose?: () => void,
	}): { close(): void },
};

let windows = 0;

const checked = (notes: Note[], keys: number): Note[] => {
	for (const note of notes) {
		const end = note.end ?? note.time;
		if (!Number.isFinite(note.time) || !Number.isFinite(end) || end < note.time
			|| !Number.isInteger(note.column) || note.column < 0 || note.column >= keys) {
			throw new Error(`editor.edit: a note at ${note.time} in column ${note.column} is not valid`);
		}
	}
	return notes;
};

/** The editor API over `session` for one add-on, its registrations kept in `owned`. */
export const editorApiOf = (
	session: EditorSession,
	commands: EditorCommands,
	owned: Owned,
): EditorApi => ({
	keys: session.chart.keys,
	notes: () => session.notes,
	timing: () => session.timing,
	scroll: () => session.scroll,
	metadata: () => session.metadata,
	bookmarks: () => session.bookmarks,
	text: () => session.text(),
	edit: ({ metadata, ...change }, select) => session.editDoc({
		...change,
		...change.notes ? { notes: checked(change.notes, session.chart.keys) } : {},
		...metadata ? {
			metadata: {
				...session.metadata, ...metadata,
			},
		} : {},
	}, select),
	undo: () => session.undo(),
	redo: () => session.redo(),
	save: () => commands.save(),
	selection: () => session.selection,
	select: notes => session.select(notes),
	now: () => session.now(),
	seek: ms => session.seek(ms),
	play: () => session.play(),
	pause: () => session.pause(),
	isPlaying: () => session.isPlaying,
	snap: ms => session.snap(ms),
	divisor: () => session.divisor,
	setDivisor: divisor => session.setDivisor(divisor),
	onChange: callback => {
		const changed = () => callback();
		void session.revision.sync(changed);
		return owned.own(() => session.revision.desync(changed));
	},
	addAction: ({ id, label, keys, run }) => owned.own(registerAction({
		id: `addon.${id}`, group: 'addons', label: () => label, keys, run: () => run(),
	})),
	addTab: tab => owned.own(addTo(addonTabs, {
		...tab, id: `addon.${tab.id}`,
	})),
	addPanel: panel => owned.own(addTo(addonPanels, {
		...panel, id: `addon.${panel.id}`,
	})),
	openWindow: ({ title, width = 360, height = 280, render, onClose }) => {
		const close = owned.own(addTo(addonWindows, {
			id: ++windows, title, width, height, render, onClose,
		}));
		return { close };
	},
});
