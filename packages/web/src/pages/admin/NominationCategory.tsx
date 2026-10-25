import type { ApprovedStatus } from '@oss-idle/shared/beatmap';

/** What a set ranks as: ranked, or loved (no pp). A scheduled or live set moves at
 *  once, after a confirm: its scores stay and their pp follows. */
export default function NominationCategory({
	category, busy, scheduled, onChange,
}: {
	category: ApprovedStatus;
	busy: boolean;
	scheduled: boolean;
	onChange: (category: ApprovedStatus) => void;
}) {
	const change = (next: ApprovedStatus) => {
		if (scheduled && !confirm(next === 'loved'
			? 'Move this set to loved? Its scores stay but give no pp anymore.'
			: 'Move this set to ranked? Its scores stay and give pp again.')) return;
		onChange(next);
	};
	return <div className='nomination__stat'>
		<span className='nomination__label'>Category</span>
		<select
			className='nomination__field'
			value={category}
			disabled={busy}
			onChange={e => change(e.target.value as ApprovedStatus)}
		>
			<option value='ranked'>Ranked</option>
			<option value='loved'>Loved</option>
		</select>
	</div>;
}
