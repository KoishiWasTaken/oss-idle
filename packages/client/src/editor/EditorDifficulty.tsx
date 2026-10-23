import {
	useEffect,
	useMemo,
} from 'react';
import { useLingui } from '@lingui/react/macro';
import { starsText } from '@oss-idle/shared/display/difficulty';
import Synced from '@oss-idle/shared/helpers/synced';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import Dropdown, { type DropdownOption } from '../components/dropdown/Dropdown';
import type LightBeatmap from '../osu/beatmap/LightBeatmap';
import type EditorSession from './session';

type Choice = number | 'new' | 'copy';

type Props = {
	session: EditorSession,
	onOpen: (beatmap: LightBeatmap) => void,
	onAdd: (copy: boolean) => void,
};

/** The difficulty being edited, as a dropdown of the set's: pick another to switch,
 *  or add a new or copied one. */
export default function EditorDifficulty({ session, onOpen, onAdd }: Props) {
	const { t } = useLingui();
	useSynced(session.revision);
	const current = session.beatmap.metadata.id;
	const choice = useMemo(() => new Synced<Choice>(current), [current]);
	const difficulties = [...session.beatmap.set.beatmaps]
		.sort((a, b) => a.metadata.difficulty - b.metadata.difficulty);

	useEffect(() => {
		const pick = (value: Choice) => {
			if (value === current) return;
			void choice.set(current);
			if (value === 'new' || value === 'copy') onAdd(value === 'copy');
			else {
				const other = difficulties.find(beatmap => beatmap.metadata.id === value);
				if (other) onOpen(other);
			}
		};
		void choice.sync(pick);
		return () => choice.desync(pick);
	});

	const options: DropdownOption<Choice>[] = [
		...difficulties.map(beatmap => ({
			value: beatmap.metadata.id,
			label: (
				<span className="editor__difficulty-option">
					{beatmap.metadata.version}
					<span>{starsText(beatmap.metadata.difficulty)}★</span>
				</span>
			),
		})),
		{
			value: 'new', label: t`New difficulty`, 
		},
		{
			value: 'copy', label: t`Copy difficulty`, 
		},
	];

	return <Dropdown value={choice} options={options} className="editor__difficulty" />;
}
