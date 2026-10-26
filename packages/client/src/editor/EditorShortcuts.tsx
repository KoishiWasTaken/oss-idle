import { useLingui } from '@lingui/react/macro';
import {
	useEffect,
	useState,
} from 'react';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import {
	ACTION_GROUPS,
	actions,
	appliesTo,
	bindKeys,
	comboOf,
	type EditorAction,
	groupLabel,
	keyBindings,
	keysOf,
} from './actions';
import EditorKeyRow from './EditorKeyRow';

/** A row: an action and its keys, or one of the mouse's. */
type Row = { action: EditorAction } | { keys: string, what: string };

const keysText = (row: Row) => ('action' in row ? keysOf(row.action)[0] : row.keys);

/** By keys, alphanumerically (2 before 10); rows without one last, by name. */
const byKeys = (a: Row, b: Row) => {
	const [ka, kb] = [keysText(a), keysText(b)];
	if (ka === undefined || kb === undefined) {
		if (ka !== kb) return ka === undefined ? 1 : -1;
		return 'action' in a && 'action' in b ? a.action.label().localeCompare(b.action.label()) : 0;
	}
	return ka.localeCompare(kb, undefined, {
		numeric: true, sensitivity: 'base',
	});
};

/**
 * What the mouse and the keys do in the editor, the keys as the player bound them and
 * rebindable here (like Quaver's keybind editor: several keys an action, clashes in red).
 * Grouped like the command list, each group by its keys; a key mode's own keys (live
 * mapping's columns) only for this chart's. The search finds any action, keyless too.
 */
export default function EditorShortcuts({ keys }: { keys: number }) {
	const { t } = useLingui();
	const [all] = useSynced(actions);
	useSynced(keyBindings);
	const [query, setQuery] = useState('');
	const [capturing, setCapturing] = useState<{ id: string, index: number }>();

	// the next key press is the new key, before the editor sees it
	useEffect(() => {
		if (!capturing) return;
		const onKey = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopImmediatePropagation();
			if (e.key === 'Escape') return setCapturing(undefined);
			const combo = comboOf(e);
			const action = all.find(a => a.id === capturing.id);
			if (!combo || !action) return;
			const keys = [...keysOf(action)];
			keys[capturing.index] = combo;
			bindKeys(action, [...new Set(keys)]);
			setCapturing(undefined);
		};
		window.addEventListener('keydown', onKey, { capture: true });
		return () => window.removeEventListener('keydown', onKey, { capture: true });
	}, [capturing, all]);

	// a key two actions of this chart share; another key mode's own keys don't count
	const counts = new Map<string, number>();
	for (const action of all.filter(a => appliesTo(a, keys))) {
		for (const key of keysOf(action)) counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const clashes = new Set([...counts].filter(([, n]) => n > 1).map(([key]) => key));

	const searching = query.trim().toLowerCase();
	const shown = all.filter(a => appliesTo(a, keys) && (searching
		? a.label().toLowerCase().includes(searching)
			|| keysOf(a).some(key => key.toLowerCase().includes(searching))
		: keysOf(a).length));
	const mouse: Row[] = searching ? [] : [
		[
			t`Select: click, drag`,
			t`Select a note and move the selection onto the snap (Shift keeps its offset), or a box (Ctrl adds)`,
		],
		[t`Note: click`, t`Place a note, or remove one`],
		[t`Note + LN: drag up`, t`LN`],
		[t`Right click`, t`Remove a note`],
		[t`Wheel`, t`Move along the beat lines`],
		[t`Shift + wheel`, t`Move four lines at a time`],
		[t`Ctrl + wheel`, t`Zoom over the columns, change the beat snap elsewhere`],
	].map(([keys, what]) => ({
		keys, what,
	}));
	const groups = ([
		[t`Mouse`, mouse] as [string, Row[]],
		...ACTION_GROUPS.map((group): [string, Row[]] => [
			groupLabel(group), shown.filter(action => action.group === group).map(action => ({ action })),
		]),
	]).filter(([, rows]) => rows.length);

	return (
		<>
			<input
				className="editor__field editor__keys-search"
				value={query}
				placeholder={t`Find an action or a key`}
				onChange={e => setQuery(e.target.value)}
			/>
			{groups.map(([label, rows]) => (
				<section key={label}>
					<div className="editor__commands-group">{label}</div>
					<dl className="editor__shortcuts">
						{[...rows].sort(byKeys).map(row => ('action' in row
							? <EditorKeyRow
								key={row.action.id}
								action={row.action}
								clashes={clashes}
								capturing={capturing?.id === row.action.id ? capturing.index : undefined}
								onCapture={index => setCapturing({
									id: row.action.id, index,
								})}
							/>
							: <div key={row.keys + row.what}>
								<dt>{row.keys}</dt>
								<dd>{row.what}</dd>
							</div>))}
					</dl>
				</section>
			))}
		</>
	);
}
