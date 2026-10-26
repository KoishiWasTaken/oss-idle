import {
	Trans,
	useLingui,
} from '@lingui/react/macro';

import Synced from '@oss-idle/shared/helpers/synced';
import useSynced from '@oss-idle/shared/hooks/useSynced';

import { installedSkins } from '../../db/schema/skin';
import { currentSkinDAO } from '../../osu/skin/Skin';
import Dropdown from '../dropdown/Dropdown';

/** The enabled skin's id (0: the default skin); picking one enables it. */
const gameplaySkin = new Synced(0);
currentSkinDAO.forceSync(dao => void gameplaySkin.set(dao?.id ?? 0));
gameplaySkin.forceSync(id => {
	const current = currentSkinDAO.get();
	if (id === (current?.id ?? 0)) return;
	if (!id) return current?.setEnabled(false);
	return installedSkins.get().find(skin => skin.id === id)?.setEnabled(true);
});

export default function GameplaySkin() {
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
			<span className="opt-row__label"><Trans>Current skin</Trans></span>
			<Dropdown value={gameplaySkin} options={options} className="opt-row__dropdown" />
		</div>
	);
}
