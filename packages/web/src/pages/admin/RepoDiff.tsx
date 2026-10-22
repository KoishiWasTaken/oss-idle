export const MAX_DIFF_LINES = 20_000;

type Kind = 'file' | 'hunk' | 'add' | 'remove' | 'same';

/**
 * Each line's kind. A file's header runs from `diff --git` to its first `@@`, so an
 * added `++ x` (shown `+++ x`) still reads as an addition, never as a header.
 */
const kindsOf = (lines: string[]) => {
	let header = false;
	return lines.map((line): Kind => {
		if (line.startsWith('diff --git ')) header = true;
		else if (line.startsWith('@@')) header = false;
		if (header) return 'file';
		if (line.startsWith('@@')) return 'hunk';
		if (line.startsWith('+')) return 'add';
		if (line.startsWith('-')) return 'remove';
		return 'same';
	});
};

/** A repository's unified diff as the builder made it, coloured line by line. */
export default function RepoDiff({ diff }: { diff: string }) {
	const lines = diff.split('\n').slice(0, MAX_DIFF_LINES);
	const kinds = kindsOf(lines);
	const more = diff.split('\n').length - lines.length;
	return (
		<pre className='addons-admin__diff'>
			{lines.map((line, i) => (
				<div key={i} className={`addons-admin__diffline addons-admin__diffline--${kinds[i]}`}>
					<code>{line || ' '}</code>
				</div>
			))}
			{more > 0 && <div className='addons-admin__diffline addons-admin__diffline--hunk'>
				<code>… {more} more lines</code>
			</div>}
		</pre>
	);
}
