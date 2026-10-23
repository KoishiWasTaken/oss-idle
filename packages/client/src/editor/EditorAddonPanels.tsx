import useSynced from '@oss-idle/shared/hooks/useSynced';
import { addonPanels } from './addonUi';
import EditorAddonMount from './EditorAddonMount';

/** Add-ons' panels at the foot of the right column. */
export default function EditorAddonPanels() {
	const [panels] = useSynced(addonPanels);
	return (
		<>
			{panels.map(panel => (
				<div key={panel.id} className='editor__stat editor__addon-panel'>
					{panel.title && <span className='ladder-sum__label'>{panel.title}</span>}
					<EditorAddonMount render={panel.render} />
				</div>
			))}
		</>
	);
}
