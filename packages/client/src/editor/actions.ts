import { t } from '@lingui/core/macro';

import Synced from '@oss-idle/shared/helpers/synced';

import { Setting } from '../db/settings';
import { BUILTIN_ACTIONS } from './builtinActions';
import type EditorSession from './session';

/** What actions can do beyond the session: the editor view's own commands. */
export type EditorCommands = {
	save: () => void,
	testPlay: () => void,
	upload: () => void,
	exportSet: () => void,
	back: () => void,
	addDifficulty: (copy: boolean) => void,
};

export type ActionContext = { session: EditorSession, commands: EditorCommands };

/** Where an action is listed: the More list and the command list group by it. */
export const ACTION_GROUPS = [
	'file', 'edit', 'notes', 'live', 'playback', 'timing', 'hitsounds', 'view', 'addons',
] as const;
export type ActionGroup = typeof ACTION_GROUPS[number];

export const groupLabel = (group: ActionGroup): string => ({
	file: t`File`, edit: t`Edit`, notes: t`Notes`, live: t`Live mapping`, playback: t`Playback`,
	timing: t`Timing`,
	hitsounds: t`Hitsounds`, view: t`View`, addons: t`Add-ons`,
})[group];

/**
 * Everything the editor does by a key, a button or the command list (Ctrl+K). The keys,
 * the shortcuts list, the More list, the command list and add-ons all read this.
 */
export type EditorAction = {
	/** unique, like 'edit.undo'; an add-on's start with its own name */
	id: string,
	group: ActionGroup,
	label: () => string,
	/** the keys it answers to unless the player binds others, like 'Ctrl+Z' */
	keys?: string[],
	/** given the player's answer when the action `ask`s for one */
	run: (context: ActionContext, answer?: string) => void,
	/** when its key comes up again: the key is held, so it doesn't repeat */
	release?: (context: ActionContext) => void,
	/** what it asks for before it runs, like 'Offset (ms)': the command list prompts */
	ask?: () => string,
	/** an option: whether it is on, shown as a check */
	on?: (session: EditorSession) => boolean,
	/** one of the rarer tools: listed in More, off the panels */
	more?: boolean,
	/** only for charts of this many columns (a column's own key, say) */
	keymode?: number,
};

/** Whether `action` is one for this chart: every action, but a key mode's only for its own. */
export const appliesTo = (action: EditorAction, keys: number): boolean =>
	action.keymode === undefined || action.keymode === keys;

export const actions = new Synced<EditorAction[]>(BUILTIN_ACTIONS);

/** Add an action (an add-on's, say); returns what takes it away again. */
export const registerAction = (action: EditorAction): (() => void) => {
	void actions.set([...actions.get().filter(a => a.id !== action.id), action]);
	return () => void actions.set(actions.get().filter(a => a !== action));
};

/** The player's own keys, by action id; an action left out keeps its own. */
export const keyBindings = new Setting<Record<string, string[]>>('editor.keys', {});

export const keysOf = (action: EditorAction): string[] =>
	keyBindings.get()[action.id] ?? action.keys ?? [];

/** Give `action` these keys; its own again when they are its defaults. */
export const bindKeys = (action: EditorAction, keys: string[]): void => {
	const rest = Object.fromEntries(Object.entries(keyBindings.get())
		.filter(([id]) => id !== action.id));
	const own = keys.join() === (action.keys ?? []).join();
	void keyBindings.set(own ? rest : {
		...rest, [action.id]: keys,
	});
};

const KEY_NAMES: Record<string, string> = {
	' ': 'Space', arrowup: 'Up', arrowdown: 'Down', arrowleft: 'Left', arrowright: 'Right',
	delete: 'Del', backspace: 'Backspace', tab: 'Tab', enter: 'Enter', escape: 'Esc',
	home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown',
};

/** Keys named by where they are, whatever they print: song select's rate keys. */
const CODE_NAMES: Record<string, string> = {
	Minus: '-', Equal: '=', 
};

/** What those keys print on this keyboard, like AZERTY's ')' for '-'. */
let printed: Record<string, string> = {};
type LayoutMap = { get(code: string): string | undefined };
void (navigator as { keyboard?: { getLayoutMap(): Promise<LayoutMap> } }).keyboard?.getLayoutMap()
	.then(map => {
		printed = Object.fromEntries(Object.entries(CODE_NAMES)
			.map(([code, name]) => [name, map.get(code)?.toUpperCase() ?? name]));
	})
	.catch(() => undefined);

/** A binding as this keyboard shows it. */
export const keyLabel = (combo: string): string =>
	combo.replace(/(^|\+)([-=])$/, (_, plus: string, key: string) => plus + (printed[key] ?? key));

/** A key press as the bindings write it, like 'Ctrl+Shift+Z'; undefined for a lone
 *  modifier. Digits go by the key itself, so AZERTY's unshifted digit keys are digits too. */
export const comboOf = (e: KeyboardEvent): string | undefined => {
	const digit = /^(Digit|Numpad)(\d)$/.exec(e.code)?.[2] ?? CODE_NAMES[e.code];
	const key = e.key.toLowerCase();
	if (!digit && ['control', 'shift', 'alt', 'meta'].includes(key)) return undefined;
	const name = digit ?? KEY_NAMES[key] ?? (key.length === 1 ? key.toUpperCase() : e.key);
	return [
		e.ctrlKey || e.metaKey ? 'Ctrl' : '', e.shiftKey ? 'Shift' : '', e.altKey ? 'Alt' : '', name,
	].filter(Boolean).join('+');
};

/** The action a key press runs on a chart of `keys` columns, if any. */
export const actionFor = (e: KeyboardEvent, keys: number): EditorAction | undefined => {
	const combo = comboOf(e);
	return combo === undefined ? undefined
		: actions.get().find(a => appliesTo(a, keys) && keysOf(a).includes(combo));
};
