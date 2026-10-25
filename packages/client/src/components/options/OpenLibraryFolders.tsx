import { Trans } from '@lingui/react/macro';
import Log from '@oss-idle/shared/helpers/log';
import type { LibraryKind } from '@oss-idle/shared/desktop';
import Button from './controls/Button';
import { library } from '../../library';

/** The maps, skins and add-ons folders, opened in the file explorer (desktop). */
export default function OpenLibraryFolders() {
	const folders = library();
	if (!folders) return <></>;
	const open = (kind: LibraryKind) => () =>
		void folders.reveal(kind).catch(e => Log.errorPopup(String(e)));
	return <>
		<Button onClick={open('maps')} label={<Trans>Open the maps folder</Trans>} />
		<Button onClick={open('skins')} label={<Trans>Open the skins folder</Trans>} />
		<Button onClick={open('addons')} label={<Trans>Open the add-ons folder</Trans>} />
	</>;
}
