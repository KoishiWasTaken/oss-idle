import { useMemo } from 'react';
import Prism from 'prismjs';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import {
	type DiffLine,
	diffLines,
} from '../helpers/diff.js';

const SIGIL = {
	same: ' ', add: '+', remove: '-',
} as const;

type Classes = {
	root: string,
	/** Each line also gets `${line}--add` / `--remove` / `--same`. */
	line: string,
	sigil: string,
};

/** The web admin's look; the client passes its own. */
const ADMIN: Classes = {
	root: 'addons-admin__diff',
	line: 'addons-admin__diffline',
	sigil: 'addons-admin__sigil',
};

const highlight = (line: DiffLine) => Prism.highlight(
	line.text,
	Prism.languages.javascript,
	'javascript',
) || ' ';

/** Unified line diff of `before` → `after`, each line syntax-highlighted. */
export default function CodeDiff({
	before,
	after,
	classes = ADMIN,
}: {
	before: string,
	after: string,
	classes?: Classes,
}) {
	const lines = useMemo(() => diffLines(before, after), [before, after]);
	return (
		<pre className={classes.root}>
			{lines.map((line, i) => (
				<div key={i} className={`${classes.line} ${classes.line}--${line.type}`}>
					<span className={classes.sigil}>{SIGIL[line.type]}</span>
					<code dangerouslySetInnerHTML={{ __html: highlight(line) }} />
				</div>
			))}
		</pre>
	);
}
