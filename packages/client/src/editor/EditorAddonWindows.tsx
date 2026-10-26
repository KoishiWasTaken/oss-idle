import useSynced from '@oss-idle/shared/hooks/useSynced';

import { addonWindows } from './addonUi';
import EditorAddonWindow from './EditorAddonWindow';

/** Every window add-ons have open over the editor. */
export default function EditorAddonWindows() {
	const [windows] = useSynced(addonWindows);
	return (
		<>
			{windows.map(shown => (
				<EditorAddonWindow
					key={shown.id}
					window={shown}
					onClose={() => {
						void addonWindows.set(addonWindows.get().filter(other => other !== shown));
						shown.onClose?.();
					}}
				/>
			))}
		</>
	);
}
