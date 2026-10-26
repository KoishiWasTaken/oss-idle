import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import CodeDiff from '@oss-idle/shared/display/CodeDiff';

import CodeEditor from '../listing/CodeEditor';
import CodeView from '../listing/CodeView';
import AddonCodeCheck from './AddonCodeCheck';

type Props = {
	editing: boolean,
	source: string,
	onChange: (source: string) => void,
	/** View mode: an older source to diff against, enabling "View changes". */
	diffAgainst?: string,
};

type Shown = 'none' | 'code' | 'diff';

const DIFF = {
	root: 'listing-diff',
	line: 'listing-diff__line',
	sigil: 'listing-diff__sigil',
};

/**
 * The right column shared by every add-on view: an editable editor, or in view
 * mode the code / its diff, hidden until asked for since a big add-on is slow
 * to highlight.
 */
export default function AddonCodePane({
	editing,
	source,
	onChange,
	diffAgainst,
}: Props) {
	const [shown, setShown] = useState<Shown>('none');
	const toggle = (s: Shown) => setShown(cur => (cur === s ? 'none' : s));

	if (editing) {
		return (
			<>
				<div className='listing-view__codehead'>
					<span className='listing-view__codelabel'><Trans>Code</Trans></span>
				</div>
				<CodeEditor value={source} onChange={onChange} className='addon-code' />
				<AddonCodeCheck source={source} />
			</>
		);
	}

	return (
		<>
			<div className='listing-view__codehead'>
				<button
					className={`listings__sort-btn ${shown === 'code' ? 'is-active' : ''}`}
					onClick={() => toggle('code')}
				>
					{shown === 'code' ? <Trans>Hide code</Trans> : <Trans>View code</Trans>}
				</button>
				{diffAgainst !== undefined && (
					<button
						className={`listings__sort-btn ${shown === 'diff' ? 'is-active' : ''}`}
						onClick={() => toggle('diff')}
					>
						{shown === 'diff' ? <Trans>Hide changes</Trans> : <Trans>View changes</Trans>}
					</button>
				)}
			</div>
			{shown === 'code' && <CodeView source={source} />}
			{shown === 'diff' && diffAgainst !== undefined && (
				<CodeDiff before={diffAgainst} after={source} classes={DIFF} />
			)}
		</>
	);
}
