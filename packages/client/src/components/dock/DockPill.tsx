import DockQueueButton from './DockQueueButton';
import DockTransport from './DockTransport';
import DockUpgradesButton from './DockUpgradesButton';
import DockUpNext from './DockUpNext';

type Props = {
	/** the scene under it has a bottom bar to stay clear of */
	aboveBar?: boolean;
};

/**
 * The dock while gameplay is up: what plays next and when, and the controls a
 * playing screen needs. It never expands, and it is a fixed size, so nothing
 * in it moves when the next map changes.
 */
export default function DockPill({ aboveBar = false }: Props) {
	return (
		<div className={`dock dock--pill ${aboveBar ? 'dock--above-bar' : ''}`}>
			<DockUpNext />
			<div className="dock__bar">
				<DockTransport compact />
				<DockUpgradesButton />
				<DockQueueButton />
			</div>
		</div>
	);
}
