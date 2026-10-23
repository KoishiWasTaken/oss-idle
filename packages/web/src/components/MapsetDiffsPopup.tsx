import './MapsetDiffsPopup.css';
import {
	useEffect,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { PanelDiff } from '@oss-idle/shared/beatmap';
import DifficultyBadge from './DifficultyBadge';
import ManiaIcon from './ManiaIcon';
import Link from './Link';

export const POPUP_FADE_MS = 150;

type Props = {
	setId: number,
	diffs: PanelDiff[],
	/** the panel it opens under */
	anchor: HTMLElement | null,
	visible: boolean,
	onEnter: () => void,
	onLeave: () => void,
};

/** osu!web's difficulty list under a set's panel, easiest first: each one links to it. */
export default function MapsetDiffsPopup({
	setId, diffs, anchor, visible, onEnter, onLeave,
}: Props) {
	const [mounted, setMounted] = useState(false);
	const [opaque, setOpaque] = useState(false);

	// mounted, then faded in; faded out, then gone
	useEffect(() => {
		if (visible) {
			setMounted(true);
			const frame = requestAnimationFrame(() => setOpaque(true));
			return () => cancelAnimationFrame(frame);
		}
		setOpaque(false);
		const gone = setTimeout(() => setMounted(false), POPUP_FADE_MS);
		return () => clearTimeout(gone);
	}, [visible]);

	if (!mounted || !anchor) return null;
	const rect = anchor.getBoundingClientRect();
	const sorted = [...diffs].sort((a, b) => a.sr - b.sr);
	return createPortal(
		<div
			className='beatmaps-popup'
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
			style={{
				top: window.scrollY + rect.bottom,
				left: window.scrollX + rect.left,
				width: rect.width,
				opacity: opaque ? 1 : 0,
				transitionDuration: `${POPUP_FADE_MS}ms`,
				'--panel-height': `${rect.height}px`,
			} as React.CSSProperties}
		>
			<div className='beatmaps-popup__content'>
				<div className='beatmaps-popup__group'>
					{sorted.map(diff => (
						<Link
							key={diff.id}
							to='/maps/$id'
							params={{ id: String(setId) }}
							search={{ diff: diff.id }}
							className='beatmaps-popup-item'
						>
							<span className='beatmaps-popup-item__icon'><ManiaIcon /></span>
							<DifficultyBadge stars={diff.sr} />
							<span className='beatmaps-popup-item__version'>{diff.version}</span>
						</Link>
					))}
				</div>
			</div>
		</div>,
		document.body,
	);
}
