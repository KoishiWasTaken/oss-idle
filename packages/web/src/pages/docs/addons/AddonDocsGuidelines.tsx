import { ADDON_RULES } from '@oss-idle/shared/addonRules';
import Link from '../../../components/Link';

/** What the reviewers look for: the code rules the game enforces, and the guidelines. */
export default function AddonDocsGuidelines() {
	return <>
		<h1 id='guidelines'>Guidelines</h1>
		<p>
			Add-ons must do what they say and nothing harmful (see the <Link to='/legal/rules'>rules</Link>):
			no stealing data, no hidden code, nothing sent anywhere the player was not told about.
		</p>

		<h2 id='code-rules'>Code the game refuses</h2>
		<p>
			The game reads every add-on before it accepts it, and refuses code that loads or builds other
			code, since a reviewer could not read it:
		</p>
		<ul>
			{ADDON_RULES.map(rule => <li key={rule}>{rule}</li>)}
		</ul>

		<h2 id='good-add-ons'>Good add-ons</h2>
		<ul>
			<li>
				<strong>Clean up.</strong> <code>unmount</code> undoes everything: an add-on is turned off and
				updated while the game keeps running.
			</li>
			<li>
				<strong>Stay light.</strong> Nothing heavy on every frame: work in a worker, or in steps, and
				keep what runs per frame from allocating. Players play at high frame rates.
			</li>
			<li>
				<strong>Leave the game&apos;s keys alone.</strong> Take keys only while your UI has focus
				(the SDK&apos;s <code>isolateInput</code>), and in the editor register actions, whose keys the
				player can change.
			</li>
			<li>
				<strong>Fit in.</strong> Keep your UI small and in the game&apos;s look; in the editor, start
				from a window and add a tab or a panel only for what belongs beside the editor&apos;s tools.
			</li>
			<li>
				<strong>Change charts the editor&apos;s way.</strong> Edit through <code>editor.edit</code>, so
				every change can be undone.
			</li>
			<li>
				<strong>Be readable.</strong> Leave the bundle unminified when you can: a reviewer reads it,
				or the repository it was built from.
			</li>
		</ul>

		<h2 id='review'>Review</h2>
		<p>
			A new add-on is a draft only you see. Submitting it puts it in the review queue; the team publishes
			it, sends it back with a note, or turns it down. Each new version is read again before it goes
			live, the last approved one staying up meanwhile.
		</p>
	</>;
}
