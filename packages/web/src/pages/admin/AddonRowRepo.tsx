import { useState } from 'react';
import { ADDON_DIFF_CUT } from '@oss-idle/shared/addon';
import type { AdminAddon } from '../../api/addons';
import AddonRepoLine from './AddonRepoLine';
import RepoDiff, { MAX_DIFF_LINES } from './RepoDiff';

type View = 'none' | 'diff' | 'log';

/** The build's diff from the live release, and whether it is too big to show whole. */
const diffOf = (row: AdminAddon) => {
	const diff = row.commit !== row.publishedCommit ? row.sourceDiff : undefined;
	return {
		diff,
		partial: diff !== undefined
			&& (diff.endsWith(ADDON_DIFF_CUT) || diff.split('\n').length > MAX_DIFF_LINES),
	};
};

/** A repo add-on's review: the commit built, its repository diff from the live release, the build log. */
export default function AddonRowRepo({
	row, busy, onTrusted,
}: {
	row: AdminAddon;
	busy: boolean;
	onTrusted: (trusted: boolean) => void;
}) {
	const [view, setView] = useState<View>('none');
	const toggle = (v: View) => setView(cur => cur === v ? 'none' : v);
	const { diff, partial } = diffOf(row);
	const diffLabel = row.publishedCommit
		? 'View repository changes since the live release'
		: 'View repository';

	return (
		<>
			<AddonRepoLine row={row} />
			{partial && <p className='admin-list__error'>
				The diff is too big to show whole: read the repository itself before approving.
			</p>}
			<div className='addons-admin__codebar'>
				{diff !== undefined && (
					<button
						className={`admin-list__btn ${view === 'diff' ? 'current' : ''}`}
						onClick={() => toggle('diff')}
					>
						{view === 'diff' ? 'Hide changes' : diffLabel}
					</button>
				)}
				{row.buildLog && (
					<button
						className={`admin-list__btn ${view === 'log' ? 'current' : ''}`}
						onClick={() => toggle('log')}
					>
						{view === 'log' ? 'Hide build log' : 'View build log'}
					</button>
				)}
				<label className='addons-admin__trusted'>
					<input
						type='checkbox'
						checked={row.trusted}
						disabled={busy}
						onChange={e => onTrusted(e.target.checked)}
					/>
					Trusted: new builds go live without review
				</label>
			</div>
			{view === 'diff' && diff !== undefined && (
				<div className='addons-admin__code'><RepoDiff diff={diff} /></div>
			)}
			{view === 'log' && <pre className='addons-admin__code addons-admin__log'>{row.buildLog}</pre>}
		</>
	);
}
