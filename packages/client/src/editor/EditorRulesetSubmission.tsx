import { ph } from '@lingui/core/macro';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { useState } from 'react';

import useAsync from '@oss-idle/shared/hooks/useAsync';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { rulesetLabel } from '@oss-idle/shared/rulesets/display';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import ConfirmMenu from '../components/ConfirmMenu';
import { message } from '../globals';
import type EditorSession from './session';
import {
	ownSetOf,
	rankAction,
	uploads,
} from './upload';

type Props = {
	session: EditorSession,
	/** upload the set as it stands; false when it didn't go up */
	upload: () => Promise<boolean>,
	ruleset: RulesetId,
};

/** The player's own map's way to rank in one ruleset: submit it (uploaded as it stands
 *  first), see it wait in the queue and withdraw it, or why it was sent back; a ranked one
 *  (or one planned to rank, out of the game until then), its mapper can unrank. Nothing for
 *  a map that isn't theirs online. */
export default function EditorRulesetSubmission({ session, upload, ruleset }: Props) {
	const { t } = useLingui();
	const [changes] = useSynced(uploads);
	const [confirming, setConfirming] = useState(false);
	const submission = useAsync(
		() => ownSetOf(session.text(), ruleset),
		[session.beatmap, changes, ruleset],
	);
	if (!submission) return null;
	const { setId } = submission;

	const submit = async () => {
		if (!await upload()) return;
		const refused = await rankAction(setId, 'submit', ruleset);
		message.set(refused === 'no4k'
			? t`No ${ph({ ruleset: rulesetLabel(ruleset) })} difficulty of it is online yet: upload one first`
			: refused ? t`Could not submit it for rank` : t`Submitted for rank`);
	};
	const withdraw = async () => {
		if (await rankAction(setId, 'withdraw', ruleset)) message.set(t`Could not withdraw it`);
	};
	const unrank = async () => {
		message.set(await rankAction(setId, 'unrank', ruleset)
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
	if (submission.status === 'ranked' || submission.status === 'loved') {
		return (
			<div className='editor__submission'>
				{submission.scheduled ? (
					<span className='editor__hint editor__scheduled'>
						{submission.status === 'loved'
							? <Trans>Planned, not loved yet</Trans>
							: <Trans>Planned, not ranked yet</Trans>}
					</span>
				) : (
					<span className='editor__hint'>
						{submission.status === 'loved' ? <Trans>Loved</Trans> : <Trans>Ranked</Trans>}
					</span>
				)}
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
