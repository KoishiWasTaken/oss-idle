import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import {
	ADDON_KIND,
	type AddonKind,
} from '@oss-idle/shared/addon';
import AddonIconField from './AddonIconField';

/** The editor's metadata, as typed. */
export type AddonForm = {
	name: string,
	description: string,
	tags: string,
	version: string,
	gameVersion: string,
	icon: string | null,
	kind: AddonKind,
	repoUrl: string,
};

type Props = {
	form: AddonForm,
	set: <K extends keyof AddonForm>(key: K, value: AddonForm[K]) => void,
	feedback?: string | null,
};

/** Left column of the add-on editor: moderator feedback, where the code comes from, the metadata. */
export default function AddonEditMeta({
	form, set, feedback,
}: Props) {
	const { t } = useLingui();
	const repo = form.kind === ADDON_KIND.repo;
	const kindButton = (kind: AddonKind, label: React.ReactNode) => (
		<button
			className={`addons__sort-btn ${form.kind === kind ? 'is-active' : ''}`}
			onClick={() => set('kind', kind)}
		>
			{label}
		</button>
	);

	return (
		<>
			{feedback && (
				<div className='addon-view__feedback'>
					<span className='addon-view__feedback-label'>
						<Trans>Moderator feedback</Trans>
					</span>
					{feedback}
				</div>
			)}
			<div className='addon-view__codehead'>
				{kindButton(ADDON_KIND.inline, <Trans>Code written here</Trans>)}
				{kindButton(ADDON_KIND.repo, <Trans>Built from a git repository</Trans>)}
			</div>
			<label className='addon-field'>
				<span><Trans>Name</Trans></span>
				<input value={form.name} onChange={e => set('name', e.target.value)} maxLength={80} />
			</label>
			{repo && (
				<label className='addon-field'>
					<span><Trans>Repository</Trans></span>
					<input
						value={form.repoUrl}
						onChange={e => set('repoUrl', e.target.value)}
						placeholder='https://github.com/you/your-addon'
						maxLength={512}
					/>
				</label>
			)}
			<label className='addon-field'>
				<span><Trans>Description</Trans></span>
				<textarea
					className='addon-desc'
					value={form.description}
					onChange={e => set('description', e.target.value)} maxLength={500}
				/>
			</label>
			{!repo && <div className='addon-field-row'>
				<label className='addon-field'>
					<span><Trans>Version</Trans></span>
					<input
						value={form.version}
						onChange={e => set('version', e.target.value)}
						placeholder='1.0.0'
					/>
				</label>
				<label className='addon-field'>
					<span><Trans>Game version</Trans></span>
					<input value={form.gameVersion} onChange={e => set('gameVersion', e.target.value)} />
				</label>
			</div>}
			<label className='addon-field'>
				<span><Trans>Tags</Trans></span>
				<input
					value={form.tags}
					onChange={e => set('tags', e.target.value)}
					placeholder={t`comma, separated, tags`}
				/>
			</label>
			<AddonIconField value={form.icon} onChange={icon => set('icon', icon)} />
		</>
	);
}
