import { ph } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import useSynced from '@oss-idle/shared/hooks/useSynced';

import type { SkinDAO } from '../../db/schema/skin';
import { SETTINGS } from '../../db/settings';
import { skinIconUrl } from '../../online/skins';
import { currentSkinDAO } from '../../osu/skin/Skin';
import ListingIcon from '../listing/ListingIcon';

type Props = {
	skin: SkinDAO,
	busy: boolean,
	hasUpdate: boolean,
	canPublish: boolean,
	onToggle: (enabled: boolean) => void,
	onDetails: () => void,
	onUpdate: () => void,
	onPublish: () => void,
	onExport: () => void,
	/** shows its folder, on desktop */
	onOpenFolder?: () => void,
	onUninstall: () => void,
};

/** A row in the "Installed" list. */
export default function SkinDAORow({
	skin,
	busy,
	hasUpdate,
	canPublish,
	onToggle,
	onDetails,
	onUpdate,
	onPublish,
	onExport,
	onOpenFolder,
	onUninstall,
}: Props) {
	const [current] = useSynced(currentSkinDAO);
	const [editor] = useSynced(SETTINGS.editorSkin);

	return (
		<div className={`listing ${skin.id === current?.id ? 'is-on' : ''}`}>
			<ListingIcon url={skinIconUrl(skin.icon)} name={skin.name} />
			<div className='listing__main'>
				<div className='listing__name'>
					{skin.name}{!skin.local && <span className='listing__ver'>v{skin.version}</span>}
				</div>
				<div className='listing__by'>
					{skin.authorName && <Trans>by {ph({ author: skin.authorName })}</Trans>}
					{skin.local && <span className='listing__badge'><Trans>Imported</Trans></span>}
				</div>
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
				<label className='listing-toggle'>
					<input
						type='checkbox'
						checked={skin.id === editor}
						disabled={busy}
						onChange={e => SETTINGS.editorSkin.set(e.target.checked ? skin.id : 0)}
					/>
					<span>
						<Trans>Editor</Trans>
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
				{canPublish && <button
					className='listing-btn listing-btn--primary'
					disabled={busy}
					onClick={onPublish}
				>
					<Trans>Publish</Trans>
				</button>}
				<button
					className='listing-btn'
					disabled={busy}
					onClick={onExport}
				>
					<Trans>Export</Trans>
				</button>
				{onOpenFolder && <button
					className='listing-btn'
					disabled={busy}
					onClick={onOpenFolder}
				>
					<Trans>Open folder</Trans>
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
