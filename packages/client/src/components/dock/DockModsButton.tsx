import { Trans } from '@lingui/react/macro';
import useSynced from '@oss-idle/shared/hooks/useSynced';
import { playLabel } from '@oss-idle/shared/mods';
import { isMobile } from '../../globals';
import { selectedRate } from '../../gameplay/playRate';
import { selectedMods } from '../../gameplay/playMods';
import { modSelectOpen } from '../mods/modSelectOpen';
import SceneManager, { SCENE } from '../../scenes/SceneManager';

/** Song select's Mods, for phones: their screen hides the footer it lives in. */
export default function DockModsButton() {
	const [scene] = useSynced(SceneManager.current);
	const [rate] = useSynced(selectedRate);
	const [mods] = useSynced(selectedMods);
	const active = playLabel(mods, rate);

	if (!isMobile || scene !== SCENE.SELECT) return null;

	return (
		<button
			type="button"
			className="dock__btn"
			onClick={() => void modSelectOpen.set(!modSelectOpen.get())}
		>
			<Trans>mods</Trans>{active && ` ${active}`}
		</button>
	);
}
