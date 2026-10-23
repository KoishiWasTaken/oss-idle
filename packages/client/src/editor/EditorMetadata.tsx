import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import {
	backgroundOf,
	type Metadata,
} from '@oss-idle/shared/editor/chart';
import { pickFile } from '../pickFile';
import EditorField from './EditorField';
import type EditorSession from './session';

type TextField = Exclude<keyof Metadata, 'previewTime'>;

/** The metadata tab. All but the difficulty name is shared by the set's difficulties. */
export default function EditorMetadata({ session }: { session: EditorSession }) {
	const { t } = useLingui();
	useSynced(session.revision);
	const metadata = session.metadata;

	const fields: [TextField, string][] = [
		['title', t`Title`],
		['titleUnicode', t`Title (original)`],
		['artist', t`Artist`],
		['artistUnicode', t`Artist (original)`],
		['creator', t`Mapper`],
		['version', t`Difficulty name`],
		['source', t`Source`],
		['tags', t`Tags`],
	];

	const changeBackground = async () => {
		const image = await pickFile('image/jpeg,image/png,.jpg,.jpeg,.png');
		if (image) await session.setBackground(image);
	};
	const previewTime = (value: string) => {
		const time = Number(value);
		if (Number.isFinite(time)) session.setMetadata({ previewTime: Math.round(time) });
	};

	return (
		<div className="editor__stat editor__metadata">
			{fields.map(([field, label]) => (
				<label key={field} className="editor__labelled">
					<span className="ladder-sum__label">{label}</span>
					<EditorField
						key={metadata[field]}
						label={label}
						value={metadata[field]}
						onCommit={value => session.setMetadata({ [field]: value })}
					/>
				</label>
			))}
			<label className="editor__labelled">
				<span className="ladder-sum__label"><Trans>Preview time (ms)</Trans></span>
				<span className="editor__preview">
					<EditorField
						key={metadata.previewTime}
						type="number"
						label={t`Preview time (ms)`}
						value={String(metadata.previewTime)}
						onCommit={previewTime}
					/>
					<button
						className="editor__small"
						onClick={() => session.setMetadata({ previewTime: Math.round(session.now()) })}
					>
						<Trans>Now</Trans>
					</button>
				</span>
			</label>
			<div className="editor__labelled">
				<span className="ladder-sum__label"><Trans>Background</Trans></span>
				<span className="editor__preview">
					<span className="editor__file">{backgroundOf(session.chart.text) ?? t`None`}</span>
					<button className="editor__small" onClick={() => void changeBackground()}>
						<Trans>Change...</Trans>
					</button>
				</span>
			</div>
			<span className="editor__hint">
				<Trans>All but the difficulty name is shared by the set: saving writes it to every difficulty.</Trans>
			</span>
		</div>
	);
}
