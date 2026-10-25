import { ph } from '@lingui/core/macro';
import {
	useEffect,
	useRef,
	useState,
} from 'react';
import Markdown from '@oss-idle/shared/display/Markdown';
import useKeyboardOwner from '../../input/keyboardOwner';
import {
	Plural,
	Trans,
	useLingui,
} from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	Addon as InstalledAddon,
	addonsVersion,
} from '../../db/schema/addon';
import { installAddon } from '../../addons/runtime';
import {
	AddonTypes,
	type AddonType,
} from '@oss-idle/shared/addon';
import { addonTypeLabel } from '@oss-idle/shared/display/addon';
import {
	addonIconUrl,
	browseAddons,
	recordAddonDownload,
	type Addon,
} from '../../online/addons';
import Account from '../../online/account';
import ListingIcon from '../listing/ListingIcon';
import AddonView, { detailOfDTO } from './AddonView';
import ConfirmMenu, { type Confirm } from '../ConfirmMenu';
import type { PageAction } from '../page/pageBar';

type Sort = 'created' | 'updated' | 'downloads';

export default function BrowseAddonsView() {
	const { t } = useLingui();
	const [version] = useSynced(addonsVersion);
	const [installedIds, setInstalledIds] = useState<Set<number>>(new Set());
	const [list, setList] = useState<Addon[] | undefined>();
	const [detail, setDetail] = useState<Addon | undefined>();
	const [confirming, setConfirming] = useState<Confirm | undefined>();
	const [query, setQuery] = useState('');
	const searchRef = useRef<HTMLInputElement>(null);
	useKeyboardOwner(searchRef, { active: !detail });
	const [sort, setSort] = useState<Sort>('created');
	const [type, setType] = useState<AddonType>();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		void InstalledAddon.getAll()
			.then(rows => setInstalledIds(new Set(rows.map(r => r.id))));
	}, [version]);

	// only the newest request's answer is shown: an older one landing late is dropped
	const requests = useRef(0);
	const refresh = () => {
		setError(undefined);
		const request = ++requests.current;
		return browseAddons({
			q: query.trim() || undefined, type, sort, dir: 'desc', 
		})
			.then(list => request === requests.current && setList(list))
			.catch(e => request === requests.current && setError(String(e.message ?? e)));
	};
	useEffect(() => { void refresh(); }, [sort, type]);

	// Count this player's install once (server dedupes); reflect the new total in
	// the list/detail. Signed-out players can't be counted, so skip the call.
	const recordDownload = async (id: number) => {
		if (!Account.character.get()) return;
		try {
			const { downloads } = await recordAddonDownload(id);
			setList(prev => prev?.map(a => a.id === id ? {
				...a, downloads, 
			} : a));
			setDetail(prev => prev && prev.id === id ? {
				...prev, downloads, 
			} : prev);
		} catch { /* a counter miss must not fail the local install */ }
	};

	const doInstall = (dto: Addon) => {
		setBusy(true);
		void installAddon(dto)
			.then(() => recordDownload(dto.id))
			.catch(e => setError(String((e as Error).message ?? e)))
			.finally(() => setBusy(false));
	};

	const askInstall = (dto: Addon) => setConfirming({
		title: t`Install add-on`,
		sub: t`Add-ons run with full access to the game. Only install add-ons you trust. Install "${ph({ addon: dto.name })}"?`,
		confirmLabel: t`Install`,
		color: '#ff66ab',
		onConfirm: () => doInstall(dto),
	});

	// Row action (inline, in the list).
	const installButton = (a: Addon) => installedIds.has(a.id)
		? <span className='listing__installed'><Trans>Installed</Trans></span>
		: <button 
			className='listing-btn listing-btn--primary' 
			disabled={busy} 
			onClick={() => askInstall(a)}
		>
			<Trans>Install</Trans>
		</button>;

	// Detail-view action (lives in the scene's bottom bar).
	const barInstall = (a: Addon): PageAction => installedIds.has(a.id)
		? {
			id: 'installed',
			label: <Trans>Installed</Trans>,
			static: true,
			order: 20,
		}
		: {
			id: 'install',
			label: <Trans>Install</Trans>,
			onClick: () => askInstall(a),
			disabled: busy,
			order: 20,
		};

	return (
		<>
			{detail
				? <AddonView 
					mode='view' 
					detail={detailOfDTO(detail)} 
					actions={[barInstall(detail)]} 
					onBack={() => setDetail(undefined)}
				/>
				: (
					<>
						<div className='listings__toolbar'>
							<span className='listings__search-label'><Trans>Search:</Trans></span>
							<input
								ref={searchRef}
								className='listings__search'
								value={query}
								placeholder={t`name, author or tag`}
								onChange={e => setQuery(e.target.value)}
								onKeyDown={e => { if (e.key === 'Enter') void refresh(); }}
							/>
							<div className='listings__sort'>
								<button 
									className={`listings__sort-btn ${sort === 'created' ? 'is-active' : ''}`} 
									onClick={() => setSort('created')}
								>
									<Trans>Newest</Trans>
								</button>
								<button
									className={`listings__sort-btn ${sort === 'updated' ? 'is-active' : ''}`}
									onClick={() => setSort('updated')}
								>
									<Trans>Updated</Trans>
								</button>
								<button
									className={`listings__sort-btn ${sort === 'downloads' ? 'is-active' : ''}`}
									onClick={() => setSort('downloads')}
								>
									<Trans>Most downloaded</Trans>
								</button>
							</div>
						</div>

						<div className='addon-types'>
							<span className='listings__search-label'><Trans>Type:</Trans></span>
							{[undefined, ...AddonTypes].map(option => (
								<button
									key={option ?? 'all'}
									className={`addon-type ${option === type ? 'is-active' : ''}`}
									onClick={() => setType(option)}
								>
									{option ? addonTypeLabel(option) : t`All`}
								</button>
							))}
						</div>

						{error && <div className='page__error'>{error}</div>}
						{!list && <p className='page__muted'><Trans>Loading…</Trans></p>}
						{list && list.length === 0 && <p className='page__muted'>
							<Trans>No add-ons found.</Trans>
						</p>}

						<div className='page__list'>
							{list?.map(a => (
								<div key={a.id} className='listing'>
									<ListingIcon url={addonIconUrl(a.icon)} name={a.name} />
									<div className='listing__main'>
										<div className='listing__name'>
											{a.name}<span className='listing__ver'>v{a.version}</span>
										</div>
										<div className='listing__by'>
											<Trans>by {ph({ author: a.authorName })}</Trans>
											<span className='addon__downloads'>
												{' · '}
												<Plural value={ph({ downloads: a.downloads })} one='# download' other='# downloads' />
											</span>
										</div>
										{a.description && <Markdown className='listing__desc' text={a.description} inline />}
										<div className='listing__tags'>
											{a.types.map(kind => (
												<span key={kind} className='addon-type is-active'>{addonTypeLabel(kind)}</span>
											))}
											{a.tags.map(tag => <span key={tag} className='listing__tag'>{tag}
											</span>)}
										</div>
									</div>
									<div className='listing__actions'>
										<button
											className='listing-btn' 
											onClick={() => setDetail(a)}>
											<Trans>Details</Trans>
										</button>
										{installButton(a)}
									</div>
								</div>
							))}
						</div>
					</>
				)}

			{confirming && <ConfirmMenu 
				{...confirming} 
				onClose={() => setConfirming(undefined)} 
			/>}
		</>
	);
}
