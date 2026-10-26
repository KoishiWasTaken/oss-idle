import { Trans } from '@lingui/react/macro';

import { skinStatusLabel } from '@oss-idle/shared/display/skin';
import { SKIN_STATUS } from '@oss-idle/shared/skin';

import {
	Skin,
	skinIconUrl,
} from '../../online/skins';
import ListingIcon from '../listing/ListingIcon';

type Props = {
	skin: Skin,
	busy: boolean,
	onEdit: () => void,
	onSubmit: () => void,
	onInstall: () => void,
	onDelete: () => void,
};

/** A row in the author's "Your add-ons" list. */
export default function MyAddonRow({ 
	skin, 
	busy, 
	onEdit, 
	onSubmit, 
	onInstall, 
	onDelete, 
}: Props) {
	const canSubmit = skin.status === SKIN_STATUS.UNPUBLISHED;

	return (
		<div className='listing'>
			<ListingIcon url={skinIconUrl(skin.icon)} name={skin.name} />
			<div className='listing__main'>
				<div className='listing__name'>
					{skin.name}<span className='listing__ver'>v{skin.version}</span>
				</div>
				<div className='listing__row'>
					<span className={`listing__badge listing__badge--${skin.status}`}>
						{skinStatusLabel(skin.status)}
					</span>
				</div>
			</div>
			<div className='listing__actions'>
				<button 
					className='listing-btn'
					disabled={busy} 
					onClick={onEdit}
				>
					<Trans>Edit</Trans>
				</button>
				{canSubmit && <button
					className='listing-btn listing-btn--primary' 
					disabled={busy} 
					onClick={onSubmit}
				>
					<Trans>Submit</Trans>
				</button>}
				<button 
					className='listing-btn' 
					disabled={busy} 
					onClick={onInstall}
				>
					<Trans>Install</Trans>
				</button>
				<button 
					className='listing-btn listing-btn--danger'
					disabled={busy} 
					onClick={onDelete}
				>
					<Trans>Delete</Trans>
				</button>
			</div>
		</div>
	);
}
