import { faLock } from '@fortawesome/free-solid-svg-icons';
import { ph } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { restrictAccount } from '../../api/restrictions';
import ConfirmDialog from './ConfirmDialog';

/** Moderators: restrict an account, with the reason kept for its Account Standing. */
export default function RestrictDialog({ userId, name, onDone, onClose }: {
	userId: number;
	name: string;
	onDone: () => void;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const [reason, setReason] = useState('');

	return <ConfirmDialog
		icon={faLock}
		title={t`Restrict ${ph({ name })}?`}
		sendLabel={t`Restrict`}
		canSend={!!reason.trim()}
		send={() => restrictAccount(userId, reason.trim())}
		onDone={onDone}
		onClose={onClose}
	>
		<div className='report-dialog__label'>
			{t`They can't play, chat or buy, and disappear from rankings until you lift it.`}
		</div>
		<textarea
			value={reason}
			onChange={e => setReason(e.target.value)}
			maxLength={255}
			placeholder={t`Reason`}
		/>
	</ConfirmDialog>;
}
