import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import Dropdown from '../dropdown/Dropdown';
import { installedSkins } from '../../db/schema/skin';
import { SETTINGS } from '../../db/settings';

export default function EditorSkin() {
	const { t } = useLingui();
	const [skins] = useSynced(installedSkins);
	const options = [
		{
			value: 0,
			label: t`Default skin`,
		},
		...skins.map(skin => ({
			value: skin.id,
			label: skin.name,
		})),
	];
	return (
		<div className="opt-row opt-row--fixed">
			<span className="opt-row__label"><Trans>Editor skin</Trans></span>
			<Dropdown value={SETTINGS.editorSkin} options={options} className="opt-row__dropdown" />
		</div>
	);
}
