import RatedVersion from '../RatedVersion';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import PlayQueue from '../../gameplay/playQueue';
import DockCountdown from './DockCountdown';
import DockCountdownBar from './DockCountdownBar';

type Props = {
	/** the carousel is open beside it, so an empty queue is worth explaining */
	hint?: boolean;
};

/** What is lined up behind the running play, in the order it plays: the first
 *  row says when it starts, and every row can be moved or dropped. */
export default function DockQueue({ hint = false }: Props) {
	const { t } = useLingui();
	const [queue] = useSynced(PlayQueue.state);
	const entries = queue?.entries ?? [];
	if (!entries.length) {
		if (!hint) return null;
		return (
			<div className="dock__queue">
				<div className="dock__empty">
					<Trans>Nothing queued. Click a map to add it.</Trans>
				</div>
			</div>
		);
	}

	return (
		<div className="dock__queue">
			<div className="dock__queue-head">
				<span><Trans>Up next</Trans></span>
				<span className="dock__count">{entries.length}</span>
			</div>
			<ol className="dock__list">
				{entries.map((beatmap, index) => (
					<li
						key={`${beatmap.metadata.id}-${beatmap.lockedRate}-${index}`}
						className={`dock__entry ${index === 0 ? 'is-next' : ''}`}
					>
						<span className="dock__num">{index + 1}</span>
						<span className="dock__entry-name">
							{beatmap.set.metadata.artist} - {beatmap.set.metadata.title}
							<RatedVersion version={beatmap.metadata.version} rate={beatmap.lockedRate} />
						</span>
						{index === 0 && <DockCountdown />}
						{index === 0 && <DockCountdownBar />}
						<span className="dock__entry-actions">
							<button
								type="button"
								aria-label={t`Move up`}
								disabled={index === 0}
								onClick={() => PlayQueue.move(index, index - 1)}
							>
								<FontAwesomeIcon icon={faArrowUp} />
							</button>
							<button
								type="button"
								aria-label={t`Move down`}
								disabled={index === entries.length - 1}
								onClick={() => PlayQueue.move(index, index + 1)}
							>
								<FontAwesomeIcon icon={faArrowDown} />
							</button>
							<button
								type="button"
								aria-label={t`Remove from the queue`}
								onClick={() => PlayQueue.remove(index)}
							>
								<FontAwesomeIcon icon={faXmark} />
							</button>
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}
