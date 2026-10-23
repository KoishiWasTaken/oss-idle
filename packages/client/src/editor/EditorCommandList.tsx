import {
	useEffect,
	useRef,
	useState,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import useKeyboardOwner from '../input/keyboardOwner';
import {
	ACTION_GROUPS,
	actions,
	appliesTo,
	groupLabel,
	keyLabel,
	keysOf,
	type EditorAction,
	type EditorCommands,
} from './actions';
import {
	commandAsking,
	commandListOpen,
} from './commandList';
import type EditorSession from './session';

type Props = { session: EditorSession, commands: EditorCommands };

const wordsOf = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Every word of the query starts a word of the label (punctuation is no part of either). */
const matches = (label: string, query: string) => {
	const words = wordsOf(label);
	return wordsOf(query)
		.every(part => words.some(word => word.startsWith(part)));
};

/**
 * The command list: every action and option, add-ons' included, searched by typing
 * (Ctrl+K) or browsed by group (More). Enter or a click runs one; one that asks for a
 * value (an offset, say) turns the search into its prompt.
 */
export default function EditorCommandList({ session, commands }: Props) {
	const { t } = useLingui();
	const [open] = useSynced(commandListOpen);
	const [all] = useSynced(actions);
	const [askingId] = useSynced(commandAsking);
	useSynced(session.revision);
	const [query, setQuery] = useState('');
	const [picked, setPicked] = useState(0);
	const list = useRef<HTMLDivElement>(null);
	const input = useRef<HTMLInputElement>(null);
	useKeyboardOwner(input, {
		active: open, close: () => void commandListOpen.set(false),
	});

	useEffect(() => {
		setQuery('');
		setPicked(0);
		if (!open) void commandAsking.set(undefined);
	}, [open]);

	useEffect(() => {
		list.current?.querySelector('.is-picked')?.scrollIntoView({ block: 'nearest' });
	}, [picked]);

	if (!open) return null;
	const asking = all.find(action => action.id === askingId);
	const shown = asking ? [] : ACTION_GROUPS.flatMap(group => all
		.filter(action => action.group === group && appliesTo(action, session.chart.keys)
			&& matches(action.label(), query)));
	const run = (action: EditorAction | undefined) => {
		if (!action) return;
		if (action.ask && action !== asking) {
			setQuery('');
			return void commandAsking.set(action.id);
		}
		void commandListOpen.set(false);
		action.run({
			session, commands, 
		}, asking ? query : undefined);
	};
	const onKey = (e: React.KeyboardEvent) => {
		if (asking && e.key === 'Enter') run(asking);
		else if (e.key === 'ArrowDown') setPicked(p => Math.min(shown.length - 1, p + 1));
		else if (e.key === 'ArrowUp') setPicked(p => Math.max(0, p - 1));
		else if (e.key === 'Enter') run(shown[picked]);
		else return;
		e.preventDefault();
	};

	return (
		<div className='editor__commands-shade' onMouseDown={() => void commandListOpen.set(false)}>
			<div className='editor__commands' onMouseDown={e => e.stopPropagation()}>
				<input
					className='editor__field editor__commands-search'
					ref={input}
					value={query}
					placeholder={asking?.ask?.() ?? t`Search actions and options`}
					onChange={e => {
						setQuery(e.target.value);
						setPicked(0);
					}}
					onKeyDown={onKey}
				/>
				{asking && <div className='editor__commands-group'>{asking.label()}</div>}
				<div className='editor__commands-list' ref={list}>
					{shown.map((action, i) => (
						<div key={action.id}>
							{(i === 0 || shown[i - 1].group !== action.group) && (
								<div className='editor__commands-group'>{groupLabel(action.group)}</div>
							)}
							<button
								className={i === picked ? 'editor__command is-picked' : 'editor__command'}
								onMouseEnter={() => setPicked(i)}
								onClick={() => run(action)}
							>
								<span className='editor__command-check'>{action.on?.(session) ? '✓' : ''}</span>
								<span className='editor__command-label'>{action.label()}</span>
								<kbd>{keysOf(action).map(keyLabel).join(' · ')}</kbd>
							</button>
						</div>
					))}
					{!asking && shown.length === 0 && <div className='editor__hint'>{t`Nothing matches`}</div>}
				</div>
			</div>
		</div>
	);
}
