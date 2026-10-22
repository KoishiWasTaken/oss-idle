import useSynced from '@oss-idle/shared/hooks/useSynced';
import PlayManager from '../../online/playManager';

/** The countdown to the next map, filling up. Drawn by one CSS animation set
 *  to where the countdown already is, so nothing re-renders while it runs. */
export default function DockCountdownBar() {
	const [span] = useSynced(PlayManager.span);
	return (
		<div className="dock__countbar">
			{span && (
				<b
					key={`${span.start}-${span.end}`}
					style={{
						animationDuration: `${Math.max(1, span.end - span.start)}ms`,
						animationDelay: `${span.start - Date.now()}ms`,
					}}
				/>
			)}
		</div>
	);
}
