import {
	EDITOR_API,
	EDITOR_EXAMPLE,
} from './addonDocs';
import DocsCode from './DocsCode';

/** The editor API: how an Editor add-on reaches the open editor, and everything it offers. */
export default function AddonDocsEditor() {
	return <>
		<h1 id='the-editor'>The editor</h1>
		<p>
			An add-on of the Editor type watches for the map editor:
			{' '}<code>host.editor.watch(onOpen, onClose)</code> calls <code>onOpen</code> with the
			editor&apos;s API each time the editor opens (at once if it is open), and <code>onClose</code>
			{' '}when it closes. Everything registered through that API (actions,
			tabs, panels, windows, change listeners) goes by itself when the editor closes or your add-on
			stops.
		</p>
		<p>
			By default an add-on&apos;s place is its own window over the editor, like Quaver&apos;s plugins.
			A tab, a panel or an action in Ctrl+K are there for what belongs beside the editor&apos;s own
			tools.
		</p>
		<DocsCode code={EDITOR_EXAMPLE} caption='Mirror the selection, and count the notes:' />

		<h2 id='editor-api'>The editor API</h2>
		<table>
			<thead><tr><th>Member</th><th>What it does</th></tr></thead>
			<tbody>
				{EDITOR_API.map(([signature, about]) => <tr key={signature}>
					<td><code>{signature}</code></td>
					<td>{about}</td>
				</tr>)}
			</tbody>
		</table>
		<p>
			A <code>render(element)</code> draws into the element it is given (with React, plain DOM, or
			anything else) and returns what tears it down. Times are in milliseconds of the song;
			columns count from 0.
		</p>
	</>;
}
