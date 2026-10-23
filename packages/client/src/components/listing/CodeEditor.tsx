import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prism-themes/themes/prism-vsc-dark-plus.css';

type Props = {
	value: string,
	onChange: (value: string) => void,
	/** `addon-code` scrolls in a fixed box, `skin-code` grows the page. */
	className: string,
};

/**
 * Editable JS code field with VSCode Dark+ highlighting. The editor grows with
 * its content and sets `overflow:hidden` inline on itself, so the scrolling is
 * owned by the wrapper around it (which has the real height + border).
 */
export default function CodeEditor({ value, onChange, className }: Props) {
	return (
		<div className={`listing-code ${className}`}>
			<Editor
				value={value}
				onValueChange={onChange}
				highlight={code => Prism.highlight(
					code,
					Prism.languages.javascript,
					'javascript',
				)}
				padding={12}
				tabSize={4}
				insertSpaces={false}
				className='listing-code__inner'
				textareaClassName='listing-code__area'
			/>
		</div>
	);
}
