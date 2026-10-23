import { Trans } from '@lingui/react/macro';
import type { SkinDAO } from '../../db/schema/skin';
import { skinIconUrl } from '../../online/skins';
import ListingIcon from '../listing/ListingIcon';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { currentSkinDAO } from '../../osu/skin/Skin';

type Props = {
	skin: SkinDAO,
	busy: boolean,
	hasUpdate: boolean,
	onToggle: (enabled: boolean) => void,
	onDetails: () => void,
	onUpdate: () => void,
	onUninstall: () => void,
};

/** A row in the "Installed" list. */
export default function SkinDAORow({
	skin, 
	busy, 
	hasUpdate,
	onToggle, 
	onDetails, 
	onUpdate, 
	onUninstall, 
}: Props) {
	const [current] = useSynced(currentSkinDAO);

	return (
		<div className={`listing ${skin.id === current?.id ? 'is-on' : ''}`}>
			<ListingIcon url={skinIconUrl(skin.icon)} name={skin.name} />
			<div className='listing__main'>
				<div className='listing__name'>
					{skin.name}<span className='listing__ver'>v{skin.version}</span>
				</div>
				<div className='listing__by'><Trans>by</Trans> {skin.authorName}</div>
			</div>
			<div className='listing__actions'>
				<label className='listing-toggle'>
					<input 
						type='checkbox' 
						checked={skin.id === current?.id} 
						disabled={busy} 
						onChange={e => onToggle(e.target.checked)} 
					/>
					<span>
						<Trans>Enabled</Trans>
					</span>
				</label>
				<button 
					className='listing-btn' 
					disabled={busy} 
					onClick={onDetails}>
					<Trans>Details</Trans>
				</button>
				{hasUpdate && <button 
					className='listing-btn listing-btn--primary'
					disabled={busy} 
					onClick={onUpdate}
				>
					<Trans>Update</Trans>
				</button>}
				<button 
					className='listing-btn listing-btn--danger' 
					disabled={busy} 
					onClick={onUninstall}
				>
					<Trans>Uninstall</Trans>
				</button>
			</div>
		</div>
	);
}
