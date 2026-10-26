import './ReportMessageDialog.css';

import { useLingui } from '@lingui/react/macro';
import {
	useRef,
	useState,
} from 'react';

import { reportReasonLabel } from '@oss-idle/shared/display/social';
import Log from '@oss-idle/shared/helpers/log';
import {
	REPORT_REASON,
	type ReportReason,
} from '@oss-idle/shared/social';

import useKeyboardOwner from '../../../input/keyboardOwner';
import { rpc } from '../../../online/client';
import type { PlayerChatLine } from '../state';

/** osu!web's report dialog, for a chat line: the server quotes the line itself. */
export default function ReportMessageDialog({ line, onClose }: {
	line: PlayerChatLine;
	onClose: () => void;
}) {
	const { t } = useLingui();
	const [reason, setReason] = useState<ReportReason>('chat');
	const [comment, setComment] = useState('');
	const commentRef = useRef<HTMLTextAreaElement>(null);
	useKeyboardOwner(commentRef, { close: onClose });
	const [sending, setSending] = useState(false);

	const send = async () => {
		setSending(true);
		const res = await rpc.v1.social.reports[':userId'].$post({
			param: { userId: String(line.from.userId) },
			json: {
				reason, comment, message: {
					channel: line.channel, id: line.id,
				},
			},
		}).catch(() => undefined);
		if (!res?.ok) {
			setSending(false);
			Log.errorPopup(t`The report could not be sent.`);
			return;
		}
		Log.popup(t`Report sent.`);
		onClose();
	};

	const name = line.from.name;
	return (
		<div className="report-message" onClick={onClose}>
			<div className="report-message__box" role="dialog" onClick={e => e.stopPropagation()}>
				<div className="report-message__title">{t`Report ${name}?`}</div>
				<div className="report-message__quote">{line.text}</div>
				<select value={reason} onChange={e => setReason(e.target.value as ReportReason)}>
					{REPORT_REASON.map(r => <option key={r} value={r}>{reportReasonLabel(r)}</option>)}
				</select>
				<textarea
					ref={commentRef}
					value={comment}
					onChange={e => setComment(e.target.value)}
					maxLength={2000}
				/>
				<button
					type="button"
					className="report-message__btn report-message__btn--send"
					disabled={sending || (reason === 'other' && !comment.trim())}
					onClick={() => void send()}
				>{t`Send Report`}</button>
				<button type="button" className="report-message__btn" onClick={onClose}>
					{t`Cancel`}
				</button>
			</div>
		</div>
	);
}
