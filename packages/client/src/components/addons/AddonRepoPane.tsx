import {
	useEffect,
	useState,
} from 'react';
import { Trans } from '@lingui/react/macro';
import { ADDON_BUILD_STATUS } from '@oss-idle/shared/addon';
import {
	checkAddonRepo,
	myAddons,
	renewAddonHook,
	type OwnAddon,
} from '../../online/addons';
import AddonRepoBuild from './AddonRepoBuild';

type Props = {
	addon?: OwnAddon,
	onChange: (addon: OwnAddon) => void,
};

const POLL_MS = 5000;

/** The right column of a repo add-on's editor: its webhook and its builds. */
export default function AddonRepoPane({
	addon, onChange,
}: Props) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | undefined>();

	const building = addon?.buildStatus === ADDON_BUILD_STATUS.queued
		|| addon?.buildStatus === ADDON_BUILD_STATUS.building;

	useEffect(() => {
		if (!building || !addon) return;
		const timer = setInterval(() => {
			void myAddons()
				.then(list => list.find(a => a.id === addon.id))
				.then(a => a && onChange(a))
				.catch(() => undefined);
		}, POLL_MS);
		return () => clearInterval(timer);
	}, [building, addon?.id]);

	if (!addon) {
		return (
			<div className='addon-repo'>
				<p className='page__muted'>
					<Trans>Save the add-on to get its webhook address. oss!idle builds every new version tag of the repository itself.</Trans>
				</p>
			</div>
		);
	}

	const run = async (fn: () => Promise<OwnAddon>) => {
		setBusy(true);
		setError(undefined);
		try { onChange(await fn()); }
		catch (e) { setError(String((e as Error).message ?? e)); }
		finally { setBusy(false); }
	};

	return (
		<div className='addon-repo'>
			<label className='addon-field'>
				<span><Trans>Webhook</Trans></span>
				<input readOnly value={addon.hookUrl ?? ''} onFocus={e => e.target.select()} />
			</label>
			<p className='addon-view__notice'>
				<Trans>Add this address as a push webhook of your repository, on any git host. Each new version tag (v1.2.3) is built by oss!idle from the repository, with npm ci and npm run build; addon.config.json names the built file. The build goes to review, and players get it once approved.</Trans>
			</p>
			<div className='addon-repo__row'>
				<button className='addon-btn' disabled={busy} onClick={() => run(() => renewAddonHook(addon.id))}>
					<Trans>New webhook address</Trans>
				</button>
				<button
					className='addon-btn addon-btn--primary'
					disabled={busy || building}
					onClick={() => run(() => checkAddonRepo(addon.id))}
				>
					<Trans>Check now</Trans>
				</button>
			</div>
			<AddonRepoBuild addon={addon} />
			{error && <div className='page__error'>{error}</div>}
		</div>
	);
}
