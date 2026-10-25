import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import ContextMenu from '../ContextMenu';
import { type CarouselItem } from '../BeatmapCarousel';
import { canPlayAt } from '../../gameplay/playRate';

/** The card's osu!-style right-click menu. `deleting` lives here (not in the
 *  parent) so it resets every time the menu reopens - the menu only mounts while
 *  a card is targeted.
 *
 *  Entries are not numbered: the queue ones come and go with whether the map is
 *  downloaded, so any number baked into a label is wrong half the time - and
 *  wrong in every translation of it. */
export default function CardContextMenu({ 
	item, 
	onClose, 
	onManagePlaylists, 
	onDeleteSet,
	onDeleteDifficulty,
	onClearScores, 
	onQueue,
	onPlayNext,
	onEdit,
}: {
	item: CarouselItem;
	onClose: () => void;
	onManagePlaylists: () => void;
	onDeleteSet: () => void;
	onDeleteDifficulty: () => void;
	onClearScores: () => void;
	onQueue: () => void;
	onPlayNext: () => void;
	onEdit: () => void;
}) {
	const { t } = useLingui();
	// Delete... asks what to delete, which confirms it
	const [deleting, setDeleting] = useState(false);
	// only a playable map can be queued: downloaded, at a rate within reach
	const queueOptions = item.beatmap.metadata.runtime && canPlayAt(item.beatmap.lockedRate)
		? [
			{
				label: t`Add to queue`,
				color: '#ff66ab',
				onClick: onQueue,
			},
			{
				label: t`Play next`,
				color: '#ff66ab',
				onClick: onPlayNext,
			},
		]
		: [];
	const editOption = item.beatmap.metadata.runtime
		? [{
			label: t`Edit`,
			color: '#ffcc22',
			onClick: onEdit,
		}]
		: [];
	const title = `${item.set.metadata.artist} - ${item.set.metadata.title}`;
	if (deleting) return (
		<ContextMenu
			title={title}
			sub={t`What do you want to delete?`}
			onClose={onClose}
			options={[
				{
					label: t`Delete all difficulties`,
					color: '#e93100',
					onClick: onDeleteSet,
				},
				...(item.beatmap.metadata.runtime && item.set.beatmaps.length > 1 ? [{
					label: t`Delete only ${ph({ version: item.beatmap.metadata.version })}`,
					color: '#e93100',
					onClick: onDeleteDifficulty,
				}] : []),
				{
					label: t`Cancel`,
					color: '#6b6b6b',
					onClick: onClose,
				},
			]}
		/>
	);
	return (
		<ContextMenu
			title={title}
			sub={t`What do you want to do with this beatmap?`}
			onClose={onClose}
			options={[
				...queueOptions,
				{ 
					label: t`Manage Playlists`, 
					color: '#85b81e', 
					onClick: onManagePlaylists, 
				},
				{ 
					label: t`Delete...`, 
					color: '#e93100', 
					onClick: () => setDeleting(true),
				},
				{ 
					label: t`Clear local scores`, 
					color: '#ce7dd6', 
					onClick: onClearScores, 
				},
				...editOption,
				{ 
					label: t`Cancel`,
					color: '#6b6b6b', 
					onClick: onClose, 
				},
			]}
		/>
	);
}
