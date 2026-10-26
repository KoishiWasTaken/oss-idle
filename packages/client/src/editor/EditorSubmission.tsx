import { rulesetLabel } from '@oss-idle/shared/rulesets/display';
import { rulesetOf } from '@oss-idle/shared/rulesets/ids';

import { ENABLED_RULESETS } from '../rulesets/enabled';
import EditorRulesetSubmission from './EditorRulesetSubmission';
import type EditorSession from './session';

type Props = {
	session: EditorSession,
	/** upload the set as it stands; false when it didn't go up */
	upload: () => Promise<boolean>,
};

/** The set's way to rank in each ruleset it has difficulties for: each ruleset ranks it on
 *  its own, so each gets its own row (named once there are several). */
export default function EditorSubmission({ session, upload }: Props) {
	const rulesets = ENABLED_RULESETS.filter(id => session.beatmap.set.beatmaps
		.some(b => rulesetOf(b.metadata.mode, b.metadata.keys) === id));
	if (rulesets.length < 2) {
		// a set none of them plays still gets the first's row: the server says why it can't rank
		const [only = ENABLED_RULESETS[0]] = rulesets;
		return <EditorRulesetSubmission session={session} upload={upload} ruleset={only} />;
	}
	return rulesets.map(ruleset => (
		<div key={ruleset} className='editor__ruleset-submission'>
			<span className='editor__ruleset'>{rulesetLabel(ruleset)}</span>
			<EditorRulesetSubmission session={session} upload={upload} ruleset={ruleset} />
		</div>
	));
}
