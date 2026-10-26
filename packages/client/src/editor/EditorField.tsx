import {
	type KeyboardEvent,
	useState,
} from 'react';

type Props = {
	value: string,
	onCommit: (value: string) => void,
	type?: 'text' | 'number',
	label?: string,
	autoFocus?: boolean,
};

/** An input that edits on blur or Enter, so one change is one undo step. Remount it
 *  (key on `value`) to show a value changed from elsewhere. */
export default function EditorField({
	value, onCommit, type = 'text', label, autoFocus,
}: Props) {
	const [draft, setDraft] = useState(value);
	const commit = () => {
		if (draft !== value) onCommit(draft);
	};
	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') e.currentTarget.blur();
	};
	return (
		<input
			className="editor__field"
			type={type}
			step="any"
			value={draft}
			aria-label={label}
			autoFocus={autoFocus}
			onChange={e => setDraft(e.target.value)}
			onBlur={commit}
			onKeyDown={onKeyDown}
		/>
	);
}
