import {
	Plural,
	Trans,
	useLingui,
} from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import Dropdown from '../dropdown/Dropdown';
import Checkbox from '../options/controls/Checkbox';
import {
	type DirectDisplay,
	directDisplay,
	directSearch,
	showDownloaded,
} from './directState';

/** Search, the status filter and the downloaded-maps toggle, over the match count. */
export default function DirectFilters({ matches }: { matches: number }) {
	const { t } = useLingui();
	const [search] = useSynced(directSearch);

	return (
		<div className='direct-filters'>
			<input
				className='direct-filters__search'
				value={search}
				placeholder={t`Search by artist, title, mapper, stars>5...`}
				onChange={e => directSearch.set(e.target.value)}
				autoFocus
			/>
			<div className='direct-filters__row'>
				<span className='direct-filters__label'><Trans>Display</Trans></span>
				<Dropdown<DirectDisplay>
					className='direct-filters__display'
					value={directDisplay}
					options={[
						{
							value: 'ranked', label: t`Ranked`,
						},
						{
							value: 'unranked', label: t`Unranked`, disabled: true,
						},
						{
							value: 'all', label: t`All`, disabled: true,
						},
					]}
				/>
				<div className='direct-filters__downloaded'>
					<Checkbox value={showDownloaded} label={<Trans>Show already downloaded maps</Trans>} />
				</div>
				<span className='direct-filters__matches'>
					<Plural value={matches} one='# match found' other='# matches found' />
				</span>
			</div>
		</div>
	);
}
