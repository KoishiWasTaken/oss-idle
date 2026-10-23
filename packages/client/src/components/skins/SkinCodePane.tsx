import { Trans } from '@lingui/react/macro';
import CodeEditor from '../listing/CodeEditor';
import CodeView from '../listing/CodeView';

type Props = {
	editing?: boolean,
	source: string,
	onChange: (source: string) => void,
};

/**
 * The right column shared by every skin view: an editable editor,
 * a read-only view, or a unified diff with a Code / Changes toggle
 * when a diff is given.
 */
export default function SkinCodePane({ 
	editing, 
	source, 
	onChange,
}: Props) {
	return (
		<>
			<div className='listing-view__codehead'>
				<span className='listing-view__codelabel'><Trans>Code</Trans></span>
			</div>

			{editing
				? <CodeEditor value={source} onChange={onChange} className='skin-code' />
				: <CodeView source={source} />}
		</>
	);
}
