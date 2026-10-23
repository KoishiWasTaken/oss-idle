import './ReportDialog.css';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLingui } from '@lingui/react/macro';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAction } from '@oss-idle/shared/hooks/useAction';

/** osu!web's report dialog shape: `send` runs on the main button, `onDone` once it worked. */
export default function ConfirmDialog({
	icon, title, sendLabel, canSend, send, onDone, onClose, children,
}: {
	icon: IconDefinition;
	title: string;
	sendLabel: string;
	canSend: boolean;
	send: () => Promise<unknown>;
	onDone: () => void;
	onClose: () => void;
	children: ReactNode;
}) {
	const { t } = useLingui();
	const { busy, error, run } = useAction();

	return createPortal(<>
		<div className='__blackout visible' onClick={onClose} />
		<div className='report-dialog' role='dialog'>
			<FontAwesomeIcon icon={icon} className='report-dialog__icon' />
			<div className='report-dialog__title'>{title}</div>
			{children}
			{error && <div className='report-dialog__error'>{error}</div>}
			<button
				type='button'
				className='report-dialog__btn report-dialog__btn--send'
				disabled={busy || !canSend}
				onClick={() => void run(send, onDone)}
			>{sendLabel}</button>
			<button type='button' className='report-dialog__btn' onClick={onClose}>
				{t`Cancel`}
			</button>
		</div>
	</>, document.body,
	);
}
