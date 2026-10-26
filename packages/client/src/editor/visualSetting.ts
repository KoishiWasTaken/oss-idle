import { Setting } from '../db/settings';
import {
	DEFAULT_VISUALS,
	type VisualOptions,
	withDefaults,
} from './visualOptions';

/** How the player has the field and the song behind it drawn (View tab). */
export const visualOptions = new Setting<VisualOptions>('editor.visuals', DEFAULT_VISUALS);

/** The player's view options, complete. */
export const currentVisuals = (): VisualOptions => withDefaults(visualOptions.get());

/** The side panels' widths as the player dragged them, in px; the default when unset. */
export const panelWidths = new Setting<{ left?: number, right?: number }>('editor.panels', {});
