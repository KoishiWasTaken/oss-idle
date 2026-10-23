import { useLingui } from '@lingui/react/macro';
import {
	bindKeys,
	keyLabel,
	keysOf,
	type EditorAction,
} from './actions';

type Props = {
	action: EditorAction,
	/** keys more than one action answers to */
	clashes: Set<string>,
	/** which of its keys is waiting for a press: an index, or its length for a new one */
	capturing?: number,
	onCapture: (index: number) => void,
};

/** One action's keys: click one to press another in its place, × to drop it, + to add one. */
export default function EditorKeyRow({ action, clashes, capturing, onCapture }: Props) {
	const { t } = useLingui();
	const keys = keysOf(action);
	const own = keys.join() === (action.keys ?? []).join();
	return (
		<div className="editor__key-row">
			<dt>
				{keys.map((key, i) => (
					<span key={key} className="editor__key">
						<button
							className={clashes.has(key) ? 'is-clash' : ''}
							onClick={() => onCapture(i)}
						>
							{capturing === i ? t`Press a key` : keyLabel(key)}
						</button>
						<button
							className="editor__key-drop"
							aria-label={t`Remove ${key}`}
							onClick={() => bindKeys(action, keys.filter(other => other !== key))}
						>
							×
						</button>
					</span>
				))}
				<button className="editor__key-add" onClick={() => onCapture(keys.length)}>
					{capturing === keys.length ? t`Press a key` : '+'}
				</button>
			</dt>
			<dd>
				{action.label()}
				{!own && (
					<button className="editor__key-reset" onClick={() => bindKeys(action, action.keys ?? [])}>
						{t`Reset`}
					</button>
				)}
			</dd>
		</div>
	);
}
