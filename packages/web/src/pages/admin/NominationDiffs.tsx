import {
	INTRO_SET_ID,
	MAP_TAGS,
	type MapTag,
} from '@oss-idle/shared/beatmap';
import type { Nomination } from '../../api/maps';

type Diff = Nomination['diffs'][number];

/** Per-difficulty ranked toggles: the set is scheduled as a whole, but only the
 *  ticked diffs go (or stay) ranked - the rest are invisible to the client.
 *  Non-4K diffs can never be ranked (the intro set is exempt). */
export default function NominationDiffs({
	setId, diffs, busy, live, onToggle, onTags,
}: {
	setId: number;
	diffs: Diff[];
	busy: boolean;
	live: boolean;
	onToggle: (beatmapId: number, ranked: boolean) => void;
	onTags: (beatmapId: number, tags: MapTag[]) => void;
}) {
	const title = (diff: Diff, locked: boolean): string => {
		if (locked) return 'Only 4K difficulties can be ranked';
		if (diff.ranked) return 'Ranked — click to unrank this difficulty';
		return 'Unranked — click to include it';
	};

	const toggle = (diff: Diff) => {
		// Unranking a live diff purges every score earned on it - confirm first.
		if (diff.ranked && live && !confirm(
			`Unrank "${diff.version}"? All scores and progression earned on it will be permanently deleted.`,
		)) return;
		onToggle(diff.id, !diff.ranked);
	};

	const toggleTag = (diff: Diff, tag: MapTag) => onTags(
		diff.id,
		diff.tags.includes(tag) ? diff.tags.filter(t => t !== tag) : [...diff.tags, tag],
	);

	return (
		<div className='nomination__diffs'>
			{diffs.map(diff => {
				const locked = diff.keys !== 4 && setId !== INTRO_SET_ID;
				return (
					<span key={diff.id} className='nomination__diff-group'>
						<button
							className={`nomination__diff ${diff.ranked ? 'is-ranked' : ''} ${locked ? 'is-locked' : ''}`}
							disabled={busy || (locked && !diff.ranked)}
							title={title(diff, locked)}
							onClick={() => toggle(diff)}
						>
							<span className='nomination__diff-sr'>{Number(diff.sr).toFixed(2)}☆</span>
							{locked && <span className='nomination__diff-keys'>{diff.keys}K</span>}
							<span className='nomination__diff-name'>{diff.version}</span>
						</button>
						{MAP_TAGS.map(tag => (
							<button
								key={tag}
								className={`nomination__tag ${diff.tags.includes(tag) ? 'is-on' : ''}`}
								disabled={busy}
								onClick={() => toggleTag(diff, tag)}
							>
								{tag.toUpperCase()}
							</button>
						))}
					</span>
				);
			})}
		</div>
	);
}
