import { repoCommitUrl } from '@oss-idle/shared/addon';
import type { AdminAddon } from '../../api/addons';

/** Where a repo add-on's build under review comes from. */
export default function AddonRepoLine({ row }: { row: AdminAddon }) {
	const commitLink = (commit: string, label: string) => row.repoUrl
		? <a href={repoCommitUrl(row.repoUrl, commit)} target='_blank' rel='noreferrer'>{label}</a>
		: label;
	const built = row.commit && row.tag && `${row.tag} (${row.commit.slice(0, 7)})`;
	const live = row.publishedCommit !== row.commit && row.publishedCommit;

	return (
		<span className='admin-list__creator'>
			<a href={row.repoUrl} target='_blank' rel='noreferrer'>{row.repoUrl}</a>
			{row.commit && built && <> · built {commitLink(row.commit, built)}</>}
			{live && <> · live {commitLink(live, `${row.publishedTag ?? ''} (${live.slice(0, 7)})`)}</>}
			{' · '}bundle {Math.round(row.source.length / 1024)} KB
			{' · '}build {row.buildStatus}
		</span>
	);
}
