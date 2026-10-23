import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import { faCommentSlash } from '@fortawesome/free-solid-svg-icons';
import { silenceAccount } from '../../api/restrictions';
import ConfirmDialog from './ConfirmDialog';
import SanctionLength from './SanctionLength';
import { SILENCE_LENGTHS } from './silenceLengths';

// 0 is until lifted
const LENGTHS = [...SILENCE_LENGTHS.map(l => l.seconds), 0];

/** Moderators: silence an account (no chat, no private messages), with the reason kept for
 *  its Account Standing. */
export default function SilenceDialog({ userId, name, onDone, onClose }: {
	userId: number;
	name: string;
	onDone: () => void;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const [seconds, setSeconds] = useState(LENGTHS[0]);
	const [reason, setReason] = useState('');

	return <ConfirmDialog
		icon={faCommentSlash}
		title={t`Silence ${ph({ name })}?`}
		sendLabel={t`Silence`}
		canSend={!!reason.trim()}
		send={() => silenceAccount(userId, seconds, reason.trim())}
		onDone={onDone}
		onClose={onClose}
	>
		<div className='report-dialog__label'>
			{t`They can't chat or send private messages until it ends.`}
		</div>
		<div className='report-dialog__lengths'>
			{LENGTHS.map(s => <button
				key={s}
				type='button'
				className={s === seconds ? 'current' : undefined}
				onClick={() => setSeconds(s)}
			><SanctionLength seconds={s} /></button>)}
		</div>
		<textarea
			value={reason}
			onChange={e => setReason(e.target.value)}
			maxLength={255}
			placeholder={t`Reason`}
		/>
	</ConfirmDialog>;
}
