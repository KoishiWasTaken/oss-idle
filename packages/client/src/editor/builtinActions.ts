import {
	ph,
	plural,
	t,
} from '@lingui/core/macro';
import { library } from '../library';
import { message } from '../globals';
import {
	keyBindings,
	type ActionContext,
	type EditorAction,
} from './actions';
import {
	MAX_DIVISOR,
	TOOLS,
	type Modifier,
} from './session';
import { commandListOpen } from './commandList';
import {
	METRONOME,
	hitsoundsOn,
	metronome,
} from './editorSounds';

/** The key modes the editor takes, and a column's default key: its number, 0 for the 10th. */
const KEYMODES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const digit = (column: number) => String(column % 10);

/** Each key mode's columns: `make(keymode, column)` for column 1 to keymode. */
const perColumn = (make: (keymode: number, column: number) => EditorAction) =>
	KEYMODES.flatMap(keymode => Array.from({ length: keymode }, (_, i) => make(keymode, i + 1)));

/** Live mapping: a column's key places a note at the current time (held, a long note);
 *  each key mode has its own keys. */
const liveColumn = (keymode: number, column: number): EditorAction => ({
	id: `live.${keymode}k.${column}`,
	group: 'live',
	keymode,
	label: () => t`Note in column ${column}`,
	keys: [digit(column)],
	run: ({ session }) => session.liveDown(column - 1),
	release: ({ session }) => session.liveUp(column - 1),
});

/** Swap a column of the selection with the next one picked this way (Alt + its key). */
const swapLane = (keymode: number, column: number): EditorAction => ({
	id: `edit.swapLane.${keymode}k.${column}`,
	group: 'edit',
	keymode,
	label: () => t`Swap column ${column} with the next one picked`,
	keys: [`Alt+${digit(column)}`],
	run: ({ session }) => session.pickSwapLane(column - 1),
});

/** Snap to 1/n (Shift + its number). */
const snapTo = (n: number): EditorAction => ({
	id: `timing.snap${n}`,
	group: 'timing',
	label: () => t`Beat snap 1/${n}`,
	keys: [`Shift+${n}`],
	run: ({ session }) => session.setDivisor(n),
	on: session => session.divisor === n,
});

/** Whole numbers in `answer`, like '1 4' or '1, 4'. */
const numbers = (answer = '') => answer.split(/[^\d-]+/).filter(Boolean).map(Number)
	.filter(Number.isInteger);

const resnap = ({ session }: ActionContext, divisors?: number[]) => {
	const count = session.resnap(divisors);
	message.set(count ? plural(count, {
		one: 'Resnapped # note', other: 'Resnapped # notes',
	}) : t`No notes resnapped`);
};

const modifier = (id: Modifier, label: () => string): EditorAction => ({
	id: `edit.modifier.${id}`, group: 'edit', label, more: true,
	run: ({ session }) => session.applyModifier(id),
});

/** A seek, and the same with Shift adding the notes on the way to the selection. */
const seek = (
	id: string,
	label: () => string,
	key: string,
	go: (context: ActionContext, extend: boolean) => void,
): EditorAction[] => [
	{
		id: `playback.${id}`, group: 'playback', label, keys: [key],
		run: context => go(context, false),
	},
	{
		id: `playback.${id}.select`, group: 'playback',
		label: () => t`${ph({ seek: label() })}, selecting on the way`, keys: [`Shift+${key}`],
		run: context => go(context, true),
	},
];

/** The editor's own actions; add-ons add theirs with registerAction. */
export const BUILTIN_ACTIONS: EditorAction[] = [
	{
		id: 'file.save', group: 'file', label: () => t`Save`, keys: ['Ctrl+S'],
		run: ({ commands }) => commands.save(),
	},
	{
		id: 'file.testPlay', group: 'file', label: () => t`Test play`, keys: ['T'],
		run: ({ commands }) => commands.testPlay(),
	},
	{
		id: 'file.upload', group: 'file', label: () => t`Upload`,
		run: ({ commands }) => commands.upload(),
	},
	{
		id: 'file.export', group: 'file', label: () => t`Export .osz`,
		run: ({ commands }) => commands.exportSet(),
	},
	...library() ? [{
		id: 'file.openFolder', group: 'file', label: () => t`Open the map's folder`, more: true,
		run: ({ session }) => void session.openFolder(),
	} satisfies EditorAction] : [],
	{
		id: 'file.newDifficulty', group: 'file', label: () => t`Add a new difficulty`, more: true,
		run: ({ commands }) => commands.addDifficulty(false),
	},
	{
		id: 'file.copyDifficulty', group: 'file', label: () => t`Add a copy of this difficulty`,
		more: true,
		run: ({ commands }) => commands.addDifficulty(true),
	},
	{
		id: 'file.back', group: 'file', label: () => t`Back`,
		run: ({ commands }) => commands.back(),
	},

	{
		id: 'edit.undo', group: 'edit', label: () => t`Undo`, keys: ['Ctrl+Z'],
		run: ({ session }) => session.undo(),
	},
	{
		id: 'edit.redo', group: 'edit', label: () => t`Redo`, keys: ['Ctrl+Y', 'Ctrl+Shift+Z'],
		run: ({ session }) => session.redo(),
	},
	{
		id: 'edit.selectAll', group: 'edit', label: () => t`Select all`, keys: ['Ctrl+A'],
		run: ({ session }) => session.selectAll(),
	},
	{
		id: 'edit.copy', group: 'edit', label: () => t`Copy`, keys: ['Ctrl+C'],
		run: ({ session }) => session.copy(),
	},
	{
		id: 'edit.cut', group: 'edit', label: () => t`Cut`, keys: ['Ctrl+X'],
		run: ({ session }) => session.cut(),
	},
	{
		id: 'edit.paste', group: 'edit', label: () => t`Paste, snapped to 1/16 and 1/12`,
		keys: ['Ctrl+V'],
		run: ({ session }) => session.paste(),
	},
	{
		id: 'edit.pasteUnsnapped', group: 'edit', label: () => t`Paste as copied`,
		keys: ['Ctrl+Shift+V'],
		run: ({ session }) => session.paste(false),
	},
	{
		id: 'edit.selectAtNow', group: 'edit', label: () => t`Select the notes at the current time`,
		keys: ['Shift+C'],
		run: ({ session }) => session.selectAtNow(),
	},
	{
		id: 'edit.delete', group: 'edit', label: () => t`Delete the selection`,
		keys: ['Del', 'Backspace'],
		run: ({ session }) => session.deleteSelection(),
	},
	{
		id: 'edit.flip', group: 'edit', label: () => t`Flip the selection`,
		keys: ['Ctrl+H'], more: true,
		run: ({ session }) => session.flipSelection(),
	},
	{
		id: 'edit.reverse', group: 'edit', label: () => t`Reverse the selection in time`, more: true,
		run: ({ session }) => session.reverseSelection(),
	},
	{
		id: 'edit.swapLanes', group: 'edit', label: () => t`Swap two columns of the selection`,
		more: true, ask: () => t`Two columns, like 1 4`,
		run: ({ session }, answer) => {
			const [a, b] = numbers(answer);
			if (a !== undefined && b !== undefined) session.swapLanes(a - 1, b - 1);
		},
	},
	...perColumn(swapLane),
	{
		id: 'edit.resnap', group: 'edit', label: () => t`Resnap the selection, or everything`,
		keys: ['Shift+R'],
		more: true,
		run: context => resnap(context),
	},
	{
		id: 'edit.resnapCommon', group: 'edit',
		label: () => t`Resnap the selection, or everything, to 1/16 and 1/12`, more: true,
		run: context => resnap(context, [16, 12]),
	},
	{
		id: 'edit.resnapCustom', group: 'edit',
		label: () => t`Resnap the selection, or everything, to chosen snaps`, more: true,
		ask: () => t`Snaps, like 12 16`,
		run: (context, answer) => {
			const divisors = numbers(answer).filter(n => n >= 1 && n <= MAX_DIVISOR);
			if (divisors.length) resnap(context, divisors);
		},
	},
	modifier('mirror', () => t`Mirror the whole map`),
	modifier('noHolds', () => t`Make every LN a note`),
	modifier('fullHolds', () => t`Hold every note until the next (full LN)`),
	modifier('inverse', () => t`Inverse the whole map`),
	{
		id: 'timing.offset', group: 'timing', label: () => t`Offset the whole map`, more: true,
		ask: () => t`Offset in ms, like -15`,
		run: ({ session }, answer) => {
			const [ms] = numbers(answer);
			if (ms) session.offsetMap(ms);
		},
	},
	{
		id: 'timing.finerSnap', group: 'timing', label: () => t`Finer beat snap`, keys: ['Right'],
		run: ({ session }) => session.cycleDivisor(1),
	},
	{
		id: 'timing.coarserSnap', group: 'timing', label: () => t`Coarser beat snap`, keys: ['Left'],
		run: ({ session }) => session.cycleDivisor(-1),
	},
	...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(snapTo),
	{
		id: 'timing.customSnap', group: 'timing', label: () => t`Custom beat snap`, more: true,
		ask: () => t`A snap or a range, like 7 or 5-9`,
		run: ({ session }, answer = '') => {
			const range = /^\s*(\d+)\s*(?:-\s*(\d*))?\s*$/.exec(answer);
			if (!range) return;
			const from = Number(range[1]);
			const to = range[2] ? Number(range[2]) : from;
			const [low, high] = [Math.min(from, to), Math.max(from, to)];
			if (low < 1 || high > MAX_DIVISOR) return;
			for (let n = high; n >= low; n--) session.setDivisor(n);
			session.setDivisor(from);
		},
	},
	{
		id: 'edit.nudgeUp', group: 'edit', label: () => t`Move the selection a line later`,
		keys: ['Ctrl+Up'],
		run: ({ session }) => session.nudgeSelection(1),
	},
	{
		id: 'edit.nudgeDown', group: 'edit', label: () => t`Move the selection a line earlier`,
		keys: ['Ctrl+Down'],
		run: ({ session }) => session.nudgeSelection(-1),
	},
	{
		id: 'edit.moveLeft', group: 'edit', label: () => t`Move the selection a column left`,
		keys: ['Alt+Left'],
		run: ({ session }) => session.moveSelection(0, -1),
	},
	{
		id: 'edit.moveRight', group: 'edit', label: () => t`Move the selection a column right`,
		keys: ['Alt+Right'],
		run: ({ session }) => session.moveSelection(0, 1),
	},

	{
		id: 'notes.nextTool', group: 'notes', label: () => t`Next tool`, keys: ['Tab'],
		run: ({ session }) => session.cycleTool(),
	},
	...TOOLS.map((tool): EditorAction => ({
		id: `notes.tool.${tool}`,
		group: 'notes',
		label: () => ({
			select: t`Select tool`, note: t`Note tool`, hold: t`Note + LN tool`,
		})[tool],
		run: ({ session }) => session.setTool(tool),
		on: session => session.tool === tool,
	})),
	...perColumn(liveColumn),

	{
		id: 'playback.toggle', group: 'playback', label: () => t`Play / pause`, keys: ['Space'],
		run: ({ session }) => session.toggle(),
	},
	...seek('forward', () => t`Next beat line`, 'Up',
		({ session }, extend) => session.step(1, 1, extend)),
	...seek('back', () => t`Previous beat line`, 'Down',
		({ session }, extend) => session.step(-1, 1, extend)),
	...seek('msForward', () => t`A millisecond on`, '.',
		({ session }, extend) => session.nudgeTime(1, extend)),
	...seek('msBack', () => t`A millisecond back`, ',',
		({ session }, extend) => session.nudgeTime(-1, extend)),
	...seek('selectionStart', () => t`To the selection's start`, 'U',
		({ session }, extend) => session.seekSelection('start', extend)),
	...seek('selectionEnd', () => t`To the selection's end`, 'O',
		({ session }, extend) => session.seekSelection('end', extend)),
	...seek('mapStart', () => t`To the first note`, 'Home',
		({ session }, extend) => session.seekMap('start', extend)),
	...seek('mapEnd', () => t`To the last note`, 'End',
		({ session }, extend) => session.seekMap('end', extend)),
	{
		id: 'playback.faster', group: 'playback', label: () => t`Faster playback`,
		keys: ['Ctrl+='],
		run: ({ session }) => void session.stepSpeed(1),
	},
	{
		id: 'playback.slower', group: 'playback', label: () => t`Slower playback`,
		keys: ['Ctrl+-'],
		run: ({ session }) => void session.stepSpeed(-1),
	},
	{
		id: 'playback.keepPitch', group: 'playback', label: () => t`Keep the pitch at other speeds`,
		more: true,
		run: ({ session }) => void session.setSpeed(session.speed, !session.pitchKept),
		on: session => session.pitchKept,
	},
	...(['whistle', 'finish', 'clap'] as const).map((addition, i): EditorAction => ({
		id: `hitsounds.${addition}`,
		group: 'hitsounds',
		label: () => ({
			whistle: t`Whistle on the selection`, finish: t`Finish on the selection`, clap: t`Clap on the selection`,
		})[addition],
		keys: [['W', 'E', 'R'][i]],
		run: ({ session }) => session.toggleAddition(addition),
	})),
	{
		id: 'playback.hitsounds', group: 'playback', label: () => t`Hear the hitsounds`,
		run: () => void hitsoundsOn.set(!hitsoundsOn.get()),
		on: () => hitsoundsOn.get(),
	},
	{
		id: 'playback.metronome', group: 'playback', label: () => t`Metronome: off, beats, half beats`,
		keys: ['M'],
		run: () => {
			const next = (METRONOME.indexOf(metronome.get()) + 1) % METRONOME.length;
			void metronome.set(METRONOME[next]);
		},
		on: () => metronome.get() !== 'off',
	},
	{
		id: 'edit.bookmark', group: 'edit', label: () => t`Add a bookmark, or remove the one here`,
		keys: ['Ctrl+B'],
		run: ({ session }) => session.toggleBookmark(),
	},
	{
		id: 'playback.nextBookmark', group: 'playback', label: () => t`To the next bookmark`,
		keys: ['Ctrl+Right'],
		run: ({ session }) => session.seekBookmark(1),
	},
	{
		id: 'playback.previousBookmark', group: 'playback', label: () => t`To the previous bookmark`,
		keys: ['Ctrl+Left'],
		run: ({ session }) => session.seekBookmark(-1),
	},
	{
		id: 'view.commands', group: 'view', label: () => t`Search actions and options`,
		keys: ['Ctrl+K'],
		run: () => void commandListOpen.set(true),
	},
	{
		id: 'view.reference', group: 'view', label: () => t`Show another difficulty beside this one`,
		keys: ['Shift+P'],
		run: ({ session }) => session.toggleReference(),
		on: session => session.reference !== undefined,
	},
	{
		id: 'view.resetKeys', group: 'view', label: () => t`Reset every shortcut to its default`,
		run: () => {
			void keyBindings.set({});
			message.set(t`Every shortcut is back to its default`);
		},
	},
	{
		id: 'view.zoomIn', group: 'view', label: () => t`Zoom in`,
		run: ({ session }) => session.zoomBy(1.15),
	},
	{
		id: 'view.zoomOut', group: 'view', label: () => t`Zoom out`,
		run: ({ session }) => session.zoomBy(1 / 1.15),
	},
];
