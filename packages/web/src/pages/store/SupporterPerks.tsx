import { faDiscord } from '@fortawesome/free-brands-svg-icons/faDiscord';
import { faCloudArrowDown } from '@fortawesome/free-solid-svg-icons/faCloudArrowDown';
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faFaceSmile } from '@fortawesome/free-solid-svg-icons/faFaceSmile';
import { faFlask } from '@fortawesome/free-solid-svg-icons/faFlask';
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons/faHeartPulse';
import { faImage } from '@fortawesome/free-solid-svg-icons/faImage';
import { faMoon } from '@fortawesome/free-solid-svg-icons/faMoon';
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons/faPenToSquare';
import { faRankingStar } from '@fortawesome/free-solid-svg-icons/faRankingStar';
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ph } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { SUPPORTER_UPLOAD_BONUS } from '@oss-idle/shared/beatmap';
import { maxPendingRequests } from '@oss-idle/shared/beatmapRequest';
import {
	AWAY_HOURS,
	SUPPORTER_AWAY_HOURS,
} from '@oss-idle/shared/queue';

/** What a supporter tag gives. */
export default function SupporterPerks() {
	return <section className='store__perks'>
		<h2 className='store__perks-title'><Trans>What do I get?</Trans></h2>
		<div className='store__perks-grid'>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faHeart} /></div>
				<h3><Trans>Profile heart</Trans></h3>
				<p><Trans>A pink heart next to your name on your profile. It grows more hearts the longer you support.</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faComment} /></div>
				<h3><Trans>Golden name</Trans></h3>
				<p><Trans>Your name shows in gold in chat, for everyone to see.</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faFaceSmile} /></div>
				<h3><Trans>Your own emote</Trans></h3>
				<p><Trans>
					Add a chat emote of your own from your settings, and share it with everyone if you
					like.
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faHeartPulse} /></div>
				<h3><Trans>Main menu heart</Trans></h3>
				<p><Trans>A heart in the corner of the main menu, to thank you every time you start the game.</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faImage} /></div>
				<h3><Trans>Menu background</Trans></h3>
				<p>
					<Trans>Pick your own main menu background: set <code>menu.background</code> to an image link in your skin.</Trans>
				</p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faDownload} /></div>
				<h3><Trans>Download every map</Trans></h3>
				<p><Trans>Get every ranked beatmap in one go from the game's options.</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faCloudArrowDown} /></div>
				<h3><Trans>oss!direct</Trans></h3>
				<p><Trans>
					Browse every ranked map from the game's main menu and download any of them in
					one click, and open maps linked in the chat there too
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faMoon} /></div>
				<h3><Trans>Play on longer</Trans></h3>
				<p><Trans>
					Your character keeps playing its queue for {ph({ supporterHours: SUPPORTER_AWAY_HOURS })} hours
					after you close the game, instead of {ph({ hours: AWAY_HOURS })}.
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faPenToSquare} /></div>
				<h3><Trans>Your own profile</Trans></h3>
				<p><Trans>
					Write a me! page for your profile, and drag its sections into the order you like.
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faMusic} /></div>
				<h3><Trans>More map requests</Trans></h3>
				<p><Trans>
					Propose up to {ph({ supporterMax: maxPendingRequests(true) })} maps for ranking at
					once, instead of {ph({ max: maxPendingRequests(false) })}.
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faUpload} /></div>
				<h3><Trans>More map uploads</Trans></h3>
				<p><Trans>
					Upload {ph({ bonus: SUPPORTER_UPLOAD_BONUS })} more new maps a month from the editor.
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faRankingStar} /></div>
				<h3><Trans>Unranked leaderboards</Trans></h3>
				<p><Trans>
					Maps you upload always have a leaderboard, and playing any unranked map opens its
					leaderboard for everyone.
				</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faDiscord} /></div>
				<h3><Trans>Discord role</Trans></h3>
				<p><Trans>A pink Supporter role on our Discord server, once you link your Discord account in the options.</Trans></p>
			</div>
			<div className='store__perk'>
				<div className='store__perk-icon'><FontAwesomeIcon icon={faFlask} /></div>
				<h3><Trans>Development previews</Trans></h3>
				<p><Trans>See what's coming before anyone else in the #leaks channel, open to the Supporter role on our Discord.</Trans></p>
			</div>
		</div>
	</section>;
}
