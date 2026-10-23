import { useState } from 'react';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { message } from '../globals';
import ConfirmMenu from '../components/ConfirmMenu';
import {
	ownSetOf,
	rankAction,
	uploads,
} from './upload';
import type EditorSession from './session';

type Props = {
	session: EditorSession,
	/** upload the set as it stands; false when it didn't go up */
	upload: () => Promise<boolean>,
};

/** The player's own map's way to rank: submit it (uploaded as it stands first), see it
 *  wait in the queue and withdraw it, or why it was sent back; and a ranked one, its
 *  mapper can unrank. Nothing for a map that isn't theirs online. */
export default function EditorSubmission({ session, upload }: Props) {
	const { t } = useLingui();
	const [changes] = useSynced(uploads);
	const [confirming, setConfirming] = useState(false);
	const submission = useAsync(() => ownSetOf(session.text()), [session.beatmap, changes]);
	if (!submission) return null;
	const { setId } = submission;

	const submit = async () => {
		if (!await upload()) return;
		const refused = await rankAction(setId, 'submit');
		message.set(refused === 'no4k'
			? t`Only 4K difficulties can be ranked: add one first`
			: refused ? t`Could not submit it for rank` : t`Submitted for rank`);
	};
	const withdraw = async () => {
		if (await rankAction(setId, 'withdraw')) message.set(t`Could not withdraw it`);
	};
	const unrank = async () => {
		message.set(await rankAction(setId, 'unrank')
			? t`Could not unrank it`
			: t`Unranked: it is yours to change or take down`);
	};

	if (submission.status === 'pending') {
		return (
			<div className='editor__submission'>
				<span className='editor__hint'><Trans>In the ranking queue</Trans></span>
				<button className='editor__small' onClick={() => void withdraw()}><Trans>Withdraw</Trans></button>
			</div>
		);
	}
	if (submission.status === 'ranked') {
		return (
			<div className='editor__submission'>
				<span className='editor__hint'><Trans>Ranked</Trans></span>
				<button className='editor__small' onClick={() => setConfirming(true)}><Trans>Unrank</Trans></button>
				{confirming && (
					<ConfirmMenu
						title={t`Unrank your map?`}
						sub={
							t`Every score and all the progression players earned on it are deleted for good, and only the team can rank it again.`
						}
						confirmLabel={t`Unrank it`}
						onConfirm={() => void unrank()}
						onClose={() => setConfirming(false)}
					/>
				)}
			</div>
		);
	}
	if (submission.status !== 'unranked') return null;
	return (
		<>
			<button className='editor__action' onClick={() => void submit()}>
				<Trans>Submit for rank</Trans>
			</button>
			{submission.reviewNote && (
				<span className='editor__hint editor__review'>
					<Trans>Sent back: {ph({ note: submission.reviewNote })}</Trans>
				</span>
			)}
		</>
	);
}
