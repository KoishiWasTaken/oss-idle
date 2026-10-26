import './Bugs.css';

import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import {
	BUG_STATUS,
	BUG_TEXT_MAX,
	type BugStatus,
} from '@oss-idle/shared/bugs';
import { dateAgo } from '@oss-idle/shared/display/ago';

import {
	answerBug,
	type Bug,
} from '../../api/bugs';
import BugImagesField from './BugImagesField';
import BugMessage from './BugMessage';
import BugStatusPill from './BugStatusPill';
import { useBugImages } from './useBugImages';
import { useBugStatusLabels } from './useBugStatusLabels';

/** One report: its thread, and a reply box (with the status for the team). */
export default function BugReport({ bug }: { bug: Bug }) {
	const { t } = useLingui();
	const router = useRouter();
	const statusLabel = useBugStatusLabels();
	const [body, setBody] = useState('');
	const [status, setStatus] = useState<BugStatus>(bug.status);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string>();
	const pics = useBugImages();
	const changed = status !== bug.status;

	const send = async () => {
		setSending(true);
		setError(undefined);
		try {
			await answerBug(bug.id, {
				body, images: pics.images, ...changed && { status },
			});
			setBody('');
			pics.clear();
			await router.invalidate();
		} catch (e) {
			setError((e as Error).message);
		}
		setSending(false);
	};

	return <div className='page-contents bugs'>
		<div className='bugs__title'>
			<BugStatusPill status={bug.status} />
			<h2>{bug.title}</h2>
		</div>
		<p className='bugs__muted bugs__small'>
			#{bug.id} · {dateAgo(bug.createdAt)} · {bug.version}
			{bug.canSetStatus && <> · {bug.client}</>}
		</p>
		{bug.canSetStatus && bug.setup && <p className='bugs__muted bugs__small'>{bug.setup}</p>}

		{bug.messages.map(m => <BugMessage key={m.id} message={m} />)}

		<form className='bugs__form' onSubmit={e => { e.preventDefault(); void send(); }}>
			<textarea
				value={body}
				onChange={e => setBody(e.target.value)}
				maxLength={BUG_TEXT_MAX}
				rows={5}
				onPaste={pics.paste}
				placeholder={bug.canSetStatus ? t`Reply` : t`Add more details`}
			/>
			<BugImagesField pics={pics} />
			{error && <p className='bugs__error'>{error}</p>}
			<div className='bugs__actions'>
				{bug.canSetStatus && <select value={status} onChange={e => setStatus(e.target.value as BugStatus)}>
					{BUG_STATUS.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
				</select>}
				<button
					type='submit'
					className='bugs__btn bugs__btn--accent'
					disabled={sending || !!pics.uploading || (!body.trim() && !pics.images.length && !changed)}
				>
					<Trans>Send</Trans>
				</button>
			</div>
		</form>
	</div>;
}
