import {
	highlight,
	type Language,
} from '../samples';

/** A code example in the dark column, highlighted. */
export default function DocsCode({ code, language = 'javascript', caption }: {
	code: string;
	language?: Language;
	caption?: string;
}) {
	return <>
		{caption && <blockquote>{caption}</blockquote>}
		<pre><code dangerouslySetInnerHTML={{ __html: highlight(code, language) }} /></pre>
	</>;
}
