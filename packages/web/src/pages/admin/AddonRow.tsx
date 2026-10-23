import { useState } from 'react';
import {
	ADDON_KIND,
	ADDON_STATUS,
	type AddonStatus,
} from '@oss-idle/shared/addon';
import {
	addonIconUrl,
	type AddonVerdict,
	type AdminAddon,
} from '../../api/addons';
import AddonRowCode from './AddonRowCode';
import AddonRowRepo from './AddonRowRepo';
import { formatDate } from './formatDate';

export default function AddonRow({
	row, busy, onModerate, onTrusted,
}: {
	row: AdminAddon;
	busy: boolean;
	onModerate: (id: number, body: AddonVerdict) => void;
	onTrusted: (id: number, trusted: boolean) => void;
}) {
	const [feedback, setFeedback] = useState(row.feedback ?? '');

	const moderate = (status: AddonStatus) => onModerate(row.id, {
		status, feedback: feedback.trim() || null, source: row.source,
	});
	// Feedback without a verdict parks a reviewed add-on on hold; a published one
	// stays published (the admin is just leaving a note).
	const sendFeedback = () => moderate(row.status === ADDON_STATUS.published ?
		ADDON_STATUS.published
		: ADDON_STATUS.onHold);
	const icon = addonIconUrl(row.icon);

	return (
		<div className='admin-list__entry'>
			<div className='admin-list__info'>
				{icon
					? <img className='admin-list__cover' src={icon} alt='' />
					: <div className='admin-list__cover admin-list__cover--empty' />}
				<div className='admin-list__meta'>
					<span className='admin-list__title'>
						{row.name} <span className='admin-list__ver'>v{row.version}</span>
					</span>
					<span className='admin-list__creator'>
						by {row.authorName} · game v{row.gameVersion}
						{row.publishedVersion && row.status !== ADDON_STATUS.published
							&& ` · live v${row.publishedVersion}`}
					</span>
					{row.tags.length > 0 && <span className='admin-list__tags'>{row.tags.join(', ')}</span>}
				</div>

				<span className={`admin-list__badge admin-list__badge--${row.status}`}>{row.status}</span>

				<div className='admin-list__stat'>
					<span className='admin-list__label'>Submitted</span><span>{formatDate(row.updatedAt)}</span>
				</div>
				<div className='admin-list__stat'>
					<span className='admin-list__label'>Published</span><span>{formatDate(row.publishedAt)}</span>
				</div>
			</div>

			{row.description && <p className='admin-list__desc'>{row.description}</p>}

			{row.kind === ADDON_KIND.repo
				? <AddonRowRepo row={row} busy={busy} onTrusted={trusted => onTrusted(row.id, trusted)} />
				: <AddonRowCode source={row.source} liveSource={row.publishedSource} />}

			<textarea
				className='addons-admin__feedback'
				placeholder='Feedback (shown to the author)'
				value={feedback}
				disabled={busy}
				onChange={e => setFeedback(e.target.value)}
			/>

			<div className='admin-list__actions'>
				<button className='admin-list__btn' disabled={busy} onClick={sendFeedback}>Send feedback</button>
				{row.status !== ADDON_STATUS.published && (
					<button 
						className='admin-list__btn admin-list__btn--primary' 
						disabled={busy} 
						onClick={() => moderate(ADDON_STATUS.published)}
					>
						Approve
					</button>
				)}
				{(row.status === ADDON_STATUS.pending || row.status === ADDON_STATUS.onHold) && (
					<button
						className='admin-list__btn admin-list__btn--warn'
						disabled={busy}
						onClick={() => moderate(ADDON_STATUS.denied)}
					>
						Deny
					</button>
				)}
				{row.publishedVersion && (
					<button 
						className='admin-list__btn admin-list__btn--warn'
						disabled={busy} 
						onClick={() => moderate(ADDON_STATUS.unpublished)}
					>
						Unpublish
					</button>
				)}
			</div>
		</div>
	);
}
