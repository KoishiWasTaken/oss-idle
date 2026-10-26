import 'prism-themes/themes/prism-vsc-dark-plus.css';

import Prism from 'prismjs';
import { useMemo } from 'react';

/** Read-only JS code, highlighted with the VSCode Dark+ theme. */
export default function CodeView({ source }: { source: string }) {
	const html = useMemo(() => {
		return Prism.highlight(source, Prism.languages.javascript, 'javascript');
	}, [source]);
	return (
		<pre className='language-javascript listing-codeview'>
			<code 
				className='language-javascript' 
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</pre>
	);
}
