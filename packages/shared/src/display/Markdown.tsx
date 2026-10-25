import type { ReactNode } from 'react';

type Block =
	| {
		kind: 'p',
		lines: string[],
	}
	| {
		kind: 'h',
		level: number,
		text: string,
	}
	| {
		kind: 'ul' | 'ol',
		items: string[],
	};

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const INLINE = new RegExp([
	/`([^`]+)`/.source,
	/\*\*(.+?)\*\*/.source,
	/(?<!\w)__(.+?)__(?!\w)/.source,
	/~~(.+?)~~/.source,
	/\*(.+?)\*/.source,
	/(?<!\w)_(.+?)_(?!\w)/.source,
	/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/.source,
].join('|'), 'g');
const HEADINGS = ['h3', 'h4', 'h5'] as const;

const listItem = (line: string) => {
	const ul = BULLET.exec(line);
	const match = ul ?? NUMBERED.exec(line);
	return match && {
		kind: ul ? 'ul' as const : 'ol' as const,
		text: match[1],
	};
};

const parse = (text: string): Block[] => {
	const out: Block[] = [];
	let open: Block | undefined;
	for (const line of text.split(/\r?\n/)) {
		const heading = HEADING.exec(line);
		const item = listItem(line);
		if (!line.trim()) {
			open = undefined;
		} else if (heading) {
			out.push({
				kind: 'h',
				level: heading[1].length,
				text: heading[2],
			});
			open = undefined;
		} else if (item) {
			if (open?.kind === item.kind) open.items.push(item.text);
			else out.push(open = {
				kind: item.kind,
				items: [item.text],
			});
		} else if (open?.kind === 'p') {
			open.lines.push(line);
		} else {
			out.push(open = {
				kind: 'p',
				lines: [line],
			});
		}
	}
	return out;
};

const inline = (text: string, key = ''): ReactNode[] => {
	const out: ReactNode[] = [];
	let last = 0;
	for (const m of text.matchAll(INLINE)) {
		const [, code, bold1, bold2, strike, em1, em2, label, href] = m;
		const k = `${key}.${m.index}`;
		const bold = bold1 ?? bold2;
		const em = em1 ?? em2;
		out.push(text.slice(last, m.index));
		if (code !== undefined) out.push(<code key={k}>{code}</code>);
		else if (bold !== undefined) out.push(<strong key={k}>{inline(bold, k)}</strong>);
		else if (strike !== undefined) out.push(<s key={k}>{inline(strike, k)}</s>);
		else if (em !== undefined) out.push(<em key={k}>{inline(em, k)}</em>);
		else out.push(<a key={k} href={href} target='_blank' rel='noreferrer'>{inline(label, k)}</a>);
		last = m.index + m[0].length;
	}
	out.push(text.slice(last));
	return out;
};

const block = (b: Block, i: number) => {
	if (b.kind === 'h') {
		const H = HEADINGS[b.level - 1];
		return <H key={i}>{inline(b.text)}</H>;
	}
	if (b.kind === 'p') {
		const lines = b.lines.flatMap((l, j) => [j > 0 && <br key={`br${j}`} />, ...inline(l, `${j}`)]);
		return <p key={i}>{lines}</p>;
	}
	const List = b.kind;
	return <List key={i}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</List>;
};

const flatText = (b: Block) => {
	if (b.kind === 'p') return b.lines.join(' ');
	return b.kind === 'h' ? b.text : b.items.join(', ');
};

/** Safe Markdown subset for user-written descriptions: headings, lists, `code`, bold, italics,
 *  strikethrough, http(s) links. Never renders raw HTML. `inline` flattens it to one run of
 *  text, for clamped previews. */
export default function Markdown({
	text,
	className,
	inline: flat,
}: {
	text: string,
	className?: string,
	inline?: boolean,
}) {
	const blocks = parse(text);
	return (
		<div className={className ? `markdown ${className}` : 'markdown'}>
			{flat ? inline(blocks.map(flatText).join(' ')) : blocks.map(block)}
		</div>
	);
}
