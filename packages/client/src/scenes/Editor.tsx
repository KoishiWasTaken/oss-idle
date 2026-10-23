import {
	useEffect,
	useState,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	currentVisuals,
	visualOptions,
} from '../editor/visualSetting';
import ConfirmMenu from '../components/ConfirmMenu';
import Controls, { inTextBox } from '../input/Controls';
import type LightBeatmap from '../osu/beatmap/LightBeatmap';
import { message } from '../globals';
import { music } from '../audio/MusicPlayer';
import EditorSession from '../editor/session';
import EditorView from '../editor/EditorView';
import SceneManager, { SCENE } from './SceneManager';
import Background from './Background';
import '../components/upgrades/ladder.css';
import '../editor/editor.css';

type Props = {
	beatmap: LightBeatmap,
	/** the session to carry on with, coming back from a test play */
	resume?: EditorSession,
};

/** The map editor, on one difficulty. */
export default function Editor({ beatmap, resume }: Props) {
	const { t } = useLingui();
	const [session, setSession] = useState<EditorSession>();
	/** the difficulty switched to in place, on the same track */
	const [switched, setSwitched] = useState<LightBeatmap>();
	/** what waits on the player agreeing to drop unsaved changes */
	const [pending, setPending] = useState<() => void>();
	useSynced(visualOptions);
	const dim = 1 - currentVisuals().field.brightness / 100;
	// the backdrop follows the difficulty as stored: a new background shows at once
	const [shown, setShown] = useState<LightBeatmap>();
	useEffect(() => {
		if (!session) return;
		const follow = () => setShown(session.beatmap);
		void session.revision.sync(follow);
		return () => session.revision.desync(follow);
	}, [session]);

	useEffect(() => {
		let opened: EditorSession | undefined;
		let closed = false;
		setSwitched(undefined);
		const ready = resume ? resume.reopen().then(() => resume) : EditorSession.open(beatmap);
		ready.then(s => {
			if (closed) {
				if (s !== resume) s.dispose();
				return;
			}
			opened = s;
			setSession(s);
		}).catch(e => {
			console.error('[editor] open failed', e);
			message.set(t`Could not open this map in the editor`);
		});
		return () => {
			closed = true;
			opened?.dispose();
		};
	}, [beatmap, resume]);

	// back on the difficulty as saved: an edited server map is now its local copy
	const leave = () => {
		if (session) void music.beatmap.set(session.beatmap);
		SceneManager.set(SCENE.SELECT, 'edit');
	};
	/** Do `then`, asking first when there are unsaved changes. */
	const unlessUnsaved = (then: () => void) => {
		if (session?.dirty) setPending(() => then);
		else then();
	};
	const back = () => {
		// Escape in a field ends the typing (the field keeps what was typed)
		if (inTextBox(document.activeElement)) (document.activeElement as HTMLElement).blur();
		else if (session?.selected.size) session.clearSelection();
		else unlessUnsaved(leave);
	};
	const open = (other: LightBeatmap) => unlessUnsaved(() => {
		if (!session?.sameTrack(other)) return SceneManager.set(SCENE.EDITOR, other);
		session.switchTo(other).then(() => setSwitched(other)).catch(e => {
			console.error('[editor] switch failed', e);
			message.set(t`Could not open this map in the editor`);
		});
	});
	Controls.back.usePress(back);

	return (
		<div
			className="editor"
			// a clicked button ends any typing and keeps no focus itself: the keys belong to
			// the editor (a focused button would take Space, and click again)
			onMouseDown={e => {
				if (!(e.target as Element).closest('button')) return;
				e.preventDefault();
				if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
			}}
		>
			<Background beatmap={shown ?? switched ?? beatmap} />
			<div className="editor__dim" style={{ opacity: dim }} />
			<div className={`editor__loading ${session ? '' : 'is-shown'}`}>
				<div className="editor__loading-spinner" />
			</div>
			{session && <EditorView session={session} onBack={back} onOpen={open} />}
			{pending && (
				<ConfirmMenu
					title={t`Unsaved changes`}
					sub={t`Your changes since the last save will be lost.`}
					confirmLabel={t`Discard`}
					onConfirm={pending}
					onClose={() => setPending(undefined)}
				/>
			)}
		</div>
	);
}
