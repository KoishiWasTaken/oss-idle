import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import {
	actions,
	keyLabel,
	keysOf,
} from './actions';
import { commandListOpen } from './commandList';
import EditorAddonPanels from './EditorAddonPanels';
import EditorChecks from './EditorChecks';
import EditorPanelResize from './EditorPanelResize';
import EditorShortcuts from './EditorShortcuts';
import EditorSubmission from './EditorSubmission';
import type EditorSession from './session';

/** The key an action answers to first, as the player bound it. */
const keyOf = (id: string) => {
	const action = actions.get().find(a => a.id === id);
	const key = action && keysOf(action)[0];
	return key && keyLabel(key);
};

type Props = {
	session: EditorSession,
	onSave: () => void,
	onExport: () => void,
	onUpload: () => Promise<boolean>,
	onTest: () => void,
	onBack: () => void,
};

/** The editor's few actions, beside the playfield; editing itself is on the keys. */
export default function EditorActions({
	session, onSave, onExport, onUpload, onTest, onBack,
}: Props) {
	useSynced(session.revision);
	const [keys, setKeys] = useState(false);

	return (
		<aside className="editor__side editor__side--right">
			<EditorPanelResize side="right" />
			<button className="editor__action" disabled={!session.dirty} onClick={onSave}>
				<Trans>Save</Trans><kbd>{keyOf('file.save')}</kbd>
			</button>
			<button className="editor__action" onClick={onTest}>
				<Trans>Test play</Trans><kbd>{keyOf('file.testPlay')}</kbd>
			</button>
			<button className="editor__action" onClick={() => void onUpload()}>
				<Trans>Upload</Trans>
			</button>
			<EditorSubmission session={session} upload={onUpload} />
			<button className="editor__action" onClick={onExport}>
				<Trans>Export .osz</Trans>
			</button>
			<button className="editor__action" onClick={() => void commandListOpen.set(true)}>
				<Trans>More</Trans><kbd>{keyOf('view.commands')}</kbd>
			</button>
			<button className="editor__action" onClick={onBack}>
				<Trans>Back</Trans><kbd>Esc</kbd>
			</button>
			<EditorChecks session={session} />
			<button className="editor__small editor__keys-toggle" onClick={() => setKeys(k => !k)}>
				{keys ? <Trans>Hide shortcuts</Trans> : <Trans>Shortcuts</Trans>}
			</button>
			{keys && <EditorShortcuts keys={session.chart.keys} />}
			<EditorAddonPanels />
		</aside>
	);
}
