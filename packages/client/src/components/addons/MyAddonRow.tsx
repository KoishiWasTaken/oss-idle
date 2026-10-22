import { Trans } from '@lingui/react/macro';
import {
	ADDON_BUILD_STATUS,
	ADDON_STATUS,
} from '@oss-idle/shared/addon';
import { addonStatusLabel } from '@oss-idle/shared/display/addon';
import type { Addon } from '../../online/addons';
import AddonIcon from './AddonIcon';

type Props = {
	addon: Addon,
	busy: boolean,
	onEdit: () => void,
	onSubmit: () => void,
	onInstall: () => void,
	onDelete: () => void,
};

/** A row in the author's "Your add-ons" list. */
export default function MyAddonRow({ 
	addon, 
	busy, 
	onEdit, 
	onSubmit, 
	onInstall, 
	onDelete, 
}: Props) {
	const canSubmit = addon.status === ADDON_STATUS.unpublished
					|| addon.status === ADDON_STATUS.denied;
	const building = addon.buildStatus === ADDON_BUILD_STATUS.queued
		|| addon.buildStatus === ADDON_BUILD_STATUS.building;

	return (
		<div className='addon'>
			<AddonIcon icon={addon.icon} name={addon.name} />
			<div className='addon__main'>
				<div className='addon__name'>
					{addon.name}<span className='addon__ver'>v{addon.version}</span>
				</div>
				<div className='addon__row'>
					<span className={`addon__badge addon__badge--${addon.status}`}>
						{addonStatusLabel(addon.status)}
					</span>
					{addon.buildStatus === ADDON_BUILD_STATUS.failed && (
						<span className='addon__badge addon__badge--denied'><Trans>Build failed</Trans></span>
					)}
					{building && (
						<span className='addon__badge addon__badge--unpublished'><Trans>Building</Trans></span>
					)}
					{addon.feedback && <span className='addon__feedback'>{addon.feedback}</span>}
				</div>
			</div>
			<div className='addon__actions'>
				<button 
					className='addon-btn'
					disabled={busy} 
					onClick={onEdit}
				>
					<Trans>Edit</Trans>
				</button>
				{canSubmit && <button
					className='addon-btn addon-btn--primary' 
					disabled={busy} 
					onClick={onSubmit}
				>
					<Trans>Submit</Trans>
				</button>}
				<button 
					className='addon-btn' 
					disabled={busy} 
					onClick={onInstall}
				>
					<Trans>Install</Trans>
				</button>
				<button 
					className='addon-btn addon-btn--danger'
					disabled={busy} 
					onClick={onDelete}
				>
					<Trans>Delete</Trans>
				</button>
			</div>
		</div>
	);
}
