import type { PlayfieldGeometry } from './render/frame';
import { currentSkin } from '../osu/skin/Skin';

let last = -1;

/** Where the playfield ends on the right, HP bar included, as `--playfield-right`:
 *  the dock keeps clear of it. Written only when it moves - this runs every frame. */
export const publishPlayfieldEdge = (g: PlayfieldGeometry): void => {
	const { hpBar } = currentSkin.get().data;
	const right = Math.ceil(g.x0 + g.fieldWidth + hpBar.gap + hpBar.width);
	if (right === last) return;
	last = right;
	document.documentElement.style.setProperty('--playfield-right', `${right}px`);
};
