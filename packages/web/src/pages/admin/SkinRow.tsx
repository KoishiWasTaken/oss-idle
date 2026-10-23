import {
	SKIN_STATUS,
	type SkinStatus,
} from '@oss-idle/shared/skin';
import {
	skinIconUrl,
	type AdminSkin,
} from '../../api/skins';
import { formatDate } from './formatDate';

export default function SkinRow({ row, busy, onModerate }: {
	row: AdminSkin;
	busy: boolean;
	onModerate: (id: number, body: { status: SkinStatus; }) => void;
}) {

	const moderate = (status: SkinStatus) => onModerate(row.id, { status });
	const icon = skinIconUrl(row.icon);

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
					<span className='admin-list__creator'>by {row.authorName}</span>
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

			<div className='admin-list__actions'>
				{row.status !== SKIN_STATUS.PUBLISHED && (
					<button 
						className='admin-list__btn admin-list__btn--primary' 
						disabled={busy} 
						onClick={() => moderate(SKIN_STATUS.PUBLISHED)}
					>
						Approve
					</button>
				)}
				{row.status === SKIN_STATUS.PUBLISHED && (
					<button 
						className='admin-list__btn admin-list__btn--warn'
						disabled={busy} 
						onClick={() => moderate(SKIN_STATUS.UNPUBLISHED)}
					>
						Unpublish
					</button>
				)}
			</div>
		</div>
	);
}
