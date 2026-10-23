import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import { getUser } from '../../api/users';
import { deleteAccount } from '../../api/accounts';
import ConfirmDialog from './ConfirmDialog';

/** Admin: delete an account for good, on its owner's request. Typing the osu! username again
 *  is the confirmation. */
export default function DeleteAccountDialog({ userId, onDone, onClose }: {
	userId: number;
	onDone: () => void;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const user = useAsync(() => getUser(userId), [userId]);
	const [typed, setTyped] = useState('');
	const username = user?.username ?? '';

	return <ConfirmDialog
		icon={faTrash}
		title={t`Delete ${ph({ username })}'s account?`}
		sendLabel={t`Delete for good`}
		canSend={!!username && typed === username}
		send={() => deleteAccount(userId, typed)}
		onDone={onDone}
		onClose={onClose}
	>
		<div className='report-dialog__label'>
			{t`Every character, score and upload goes, for good. Payment records stay, without the account.`}
			{' '}
			{t`Type the osu! username to confirm.`}
		</div>
		<input value={typed} onChange={e => setTyped(e.target.value)} placeholder={username} />
	</ConfirmDialog>;
}
