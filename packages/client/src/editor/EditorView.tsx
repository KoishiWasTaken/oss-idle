import {
	useEffect,
	useRef,
} from 'react';
import { writeExtras } from '@oss-idle/shared/editor/extras';
import { useLingui } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import { inTextBox } from '../input/Controls';
import {
	isWebOpen,
	message,
	webUrl,
} from '../globals';
import EditorActions from './EditorActions';
import EditorPlayfield from './EditorPlayfield';
import EditorSummary from './EditorSummary';
import {
	addDifficulty,
	exportOsz,
} from './save';
import { uploadSet } from './upload';
import Auth from '../online/auth';
import type LightBeatmap from '../osu/beatmap/LightBeatmap';
import { launchPlay } from '../scenes/launchPlay';
import SceneManager, { SCENE } from '../scenes/SceneManager';
import type EditorSession from './session';
import {
	actionFor,
	type EditorCommands,
} from './actions';
import { startAction } from './commandList';
import { keyboardClaimed } from '../input/keyboardOwner';
import EditorCommandList from './EditorCommandList';
import EditorAddonWindows from './EditorAddonWindows';
import {
	editorClosed,
	editorOpened,
} from './editorHost';
import { editorApiOf } from './editorApi';

type Props = {
	session: EditorSession,
	onBack: () => void,
	/** open another difficulty, asking first when this one has unsaved changes */
	onOpen: (beatmap: LightBeatmap) => void,
};


/** Inputs that take no typing, and the keys one of them uses itself (a slider its arrows). */
const KEYLESS = new Set(['checkbox', 'radio', 'range', 'button', 'color', 'file']);
const INPUT_KEYS = new Set([' ', 'enter', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown']);

/** Whether a key belongs to the focused input rather than the editor: any key typed in a
 *  box, only its own keys on a slider or a tick box. */
const heldByInput = (e: KeyboardEvent): boolean =>
	(e.target instanceof HTMLInputElement && KEYLESS.has(e.target.type)
		? INPUT_KEYS.has(e.key.toLowerCase())
		: inTextBox(e.target));
/** The editor around an open session: the full-height playfield between its panels,
 *  the command list, and the keys - each one runs its action (see builtinActions). */
export default function EditorView({ session, onBack, onOpen }: Props) {
	const { t } = useLingui();

	/** Whether the stored set now holds the editor's changes. */
	const save = async (): Promise<boolean> => {
		if (!session.dirty) return true;
		try {
			await session.save();
			message.set(t`Saved`);
			return true;
		} catch (e) {
			console.error('[editor] save failed', e);
			message.set(t`Could not save`);
			return false;
		}
	};

	/** The character plays the chart as it stands, from here, then the editor is back. */
	const testPlay = () => {
		session.pause();
		launchPlay(session.beatmap, false, {
			chart: session.text(),
			start: session.now(),
			back: () => SceneManager.set(SCENE.EDITOR, session.beatmap, session),
		});
	};

	/** Save, then add a difficulty to the set - empty or a copy of this one - and open it. */
	const add = async (copy: boolean) => {
		try {
			if (session.dirty) await session.save();
			const taken = new Set(session.beatmap.set.beatmaps.map(b => b.metadata.version));
			const base = copy ? t`${ph({ version: session.metadata.version })} (copy)` : t`New difficulty`;
			let version = base;
			for (let n = 2; taken.has(version); n++) version = `${base} ${n}`;
			onOpen(await addDifficulty(session.beatmap, session.asDifficulty(version, copy),
				writeExtras(session.snapshot)));
		} catch (e) {
			console.error('[editor] new difficulty failed', e);
			message.set(t`Could not add a difficulty`);
		}
	};

	/** Save, then put the set online as the player's own unranked map. The map checks
	 *  must find no error, here and on the server, which checks every difficulty. */
	const upload = async (): Promise<boolean> => {
		if (!Auth.user.get()) {
			message.set(t`Sign in to upload your maps`);
			return false;
		}
		if (session.checks().some(issue => issue.level === 'error')) {
			message.set(t`Fix the errors the map checks found first`);
			return false;
		}
		if (!await save()) return false;
		message.set(t`Uploading...`);
		const result = await uploadSet(session.beatmap);
		if (result.ok) {
			await session.takeIds(result.ids);
			if (result.updated) {
				message.set(t`Updated online`);
				return true;
			}
			message.set(t`Upload successful`);
			// its page on the site, over the editor
			void webUrl.set(`maps/${result.setId}`);
			void isWebOpen.set(true);
			return true;
		}
		const [problem] = result.problems;
		const refusals: Record<string, string> = {
			locked: t`It is in the ranking queue: withdraw it to update it`,
			ranked: t`It is ranked: unrank it to change it`,
			notYours: t`This map belongs to another mapper`,
			notCreator: t`The map's Creator must be your osu! name`,
		};
		message.set(refusals[result.code ?? '']
			?? (problem
				? t`The map checks found errors in ${ph({ version: problem.version })}`
				: t`Could not upload: ${ph({ error: result.error })}`));
		return false;
	};

	const exportSet = async () => {
		if (await save()) await exportOsz(session.beatmap);
	};

	const commands: EditorCommands = {
		save: () => void save(),
		testPlay,
		upload: () => void upload(),
		exportSet: () => void exportSet(),
		back: onBack,
		addDifficulty: copy => void add(copy),
	};
	// the keys outlive renders: they run the commands as they stand now
	const latest = useRef(commands);
	latest.current = commands;

	// add-ons of the Editor type get the editor while it is open
	useEffect(() => {
		const forward: EditorCommands = {
			save: () => latest.current.save(),
			testPlay: () => latest.current.testPlay(),
			upload: () => latest.current.upload(),
			exportSet: () => latest.current.exportSet(),
			back: () => latest.current.back(),
			addDifficulty: copy => latest.current.addDifficulty(copy),
		};
		editorOpened(owned => editorApiOf(session, forward, owned));
		return editorClosed;
	}, [session]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (heldByInput(e) || keyboardClaimed()) return;
			const action = actionFor(e, session.chart.keys);
			if (!action) return;
			e.preventDefault();
			if (e.repeat && action.release) return;
			startAction(action, {
				session, commands: latest.current, 
			});
		};
		const onKeyUp = (e: KeyboardEvent) => {
			actionFor(e, session.chart.keys)?.release?.({
				session, commands: latest.current,
			});
		};
		window.addEventListener('keydown', onKey);
		window.addEventListener('keyup', onKeyUp);
		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('keyup', onKeyUp);
		};
	}, [session]);

	return (
		<>
			<EditorPlayfield session={session} />
			<EditorSummary session={session} onOpen={onOpen} onAdd={copy => void add(copy)} />
			<EditorCommandList session={session} commands={commands} />
			<EditorAddonWindows />
			<EditorActions
				session={session}
				onSave={() => void save()}
				onExport={() => void exportSet()}
				onUpload={upload}
				onTest={testPlay}
				onBack={onBack}
			/>
		</>
	);
}
