import { Trans } from '@lingui/react/macro';
import {
	useEffect,
	useRef,
} from 'react';

import useKeyboardOwner from '../input/keyboardOwner';
import EditorMetadata from './EditorMetadata';
import type EditorSession from './session';

/** A new map's metadata, asked for before mapping starts. */
export default function EditorNewMap({ session, onDone }: {
	session: EditorSession,
	onDone: () => void,
}) {
	const panel = useRef<HTMLDivElement>(null);
	const first = useRef<HTMLInputElement | null>(null);
	useEffect(() => {
		first.current = panel.current!.querySelector('input');
	}, []);
	useKeyboardOwner(first, { close: onDone });

	return (
		<div className="editor__commands-shade">
			<div ref={panel} className="editor__commands editor__new-map">
				<span className="editor__title"><Trans>New map</Trans></span>
				<EditorMetadata session={session} />
				<button className="editor__small" onClick={onDone}>
					<Trans>Start mapping</Trans>
				</button>
			</div>
		</div>
	);
}
