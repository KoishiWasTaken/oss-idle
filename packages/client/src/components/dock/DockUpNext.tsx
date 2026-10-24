import Marquee from '../Marquee';
import RatedVersion from '../RatedVersion';
import { Trans } from '@lingui/react/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faForwardStep } from '@fortawesome/free-solid-svg-icons/faForwardStep';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import PlayQueue from '../../gameplay/playQueue';
import DockCountdown from './DockCountdown';
import DockCountdownBar from './DockCountdownBar';
import DockSource from './DockSource';

/** The map that plays next, when it starts, and the queue it comes from. */
export default function DockUpNext() {
	const [queue] = useSynced(PlayQueue.state);
	const next = queue ? PlayQueue.next() : undefined;

	return (
		<div className="dock__upnext">
			<div className="dock__upnext-row">
				<FontAwesomeIcon icon={faForwardStep} className="dock__next-icon" />
				<Marquee className="dock__upnext-title">
					{next
						? <>
							{next.set.metadata.artist} - {next.set.metadata.title}
							<RatedVersion version={next.metadata.version} rate={next.lockedRate} />
						</>
						: <span className="dock__upnext-none"><Trans>Nothing queued</Trans></span>}
				</Marquee>
				{next && <DockCountdown />}
			</div>
			<DockCountdownBar />
			<DockSource />
		</div>
	);
}
