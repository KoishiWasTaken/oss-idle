import accuracy from '@oss-idle/shared/display/accuracy';
import { length } from '@oss-idle/shared/display/length';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { playLabel } from '@oss-idle/shared/mods';

import PlayManager from '../../online/playManager';
import { currentSkin } from '../../osu/skin/Skin';
import Marquee from '../Marquee';
import RatedVersion from '../RatedVersion';
import useTick from './useTick';

/** What the character is playing right now: the map, how it is going, how far. */
export default function DockNowPlaying() {
	const [live] = useSynced(PlayManager.live);
	const [skin] = useSynced(currentSkin);
	useTick(!!live);
	if (!live) return null;

	const total = live.endsAt - live.startedAt;
	const elapsed = Math.max(0, Math.min(total, Date.now() - live.startedAt));
	const mods = playLabel(live.mods, live.rate);

	return (
		<div className="dock__now">
			<div className="dock__grade">
				{live.grade && skin.grade(live.grade, 'dock__grade-img')}
			</div>
			<div className="dock__now-text">
				<Marquee className="dock__map">
					{live.beatmap.set.metadata.artist} - {live.beatmap.set.metadata.title}
					<RatedVersion version={live.beatmap.metadata.version} rate={live.rate} />
				</Marquee>
				<div className="dock__meta">
					{live.accuracy !== undefined && <span>{accuracy(live.accuracy)}</span>}
					{mods && <span className="dock__mods">{mods}</span>}
					<span className="dock__time">{length(elapsed / 1000)} / {length(total / 1000)}</span>
				</div>
				<div className="dock__progress">
					<b style={{ width: `${elapsed / total * 100}%` }} />
				</div>
			</div>
		</div>
	);
}
