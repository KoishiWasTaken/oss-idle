import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { reportReasonLabel } from '@oss-idle/shared/display/social';
import {
	REPORT_REASON,
	type ReportReason,
} from '@oss-idle/shared/social';

import { report } from '../../api/social';
import ConfirmDialog from './ConfirmDialog';

/** osu!web's report dialog. */
export default function ReportDialog({ userId, name, onClose }: {
	userId: number;
	name: string;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const [reason, setReason] = useState<ReportReason>('cheating');
	const [comment, setComment] = useState('');

	return <ConfirmDialog
		icon={faTriangleExclamation}
		title={t`Report ${name}?`}
		sendLabel={t`Send Report`}
		canSend={!!comment.trim()}
		send={() => report(userId, {
			reason, comment,
		})}
		onDone={onClose}
		onClose={onClose}
	>
		<div className='report-dialog__label'>{t`Reason`}</div>
		<select value={reason} onChange={e => setReason(e.target.value as ReportReason)}>
			{REPORT_REASON.map(r => <option key={r} value={r}>{reportReasonLabel(r)}</option>)}
		</select>
		<textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} />
	</ConfirmDialog>;
}
