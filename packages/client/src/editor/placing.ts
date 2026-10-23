import { Setting } from '../db/settings';

/** How notes are placed, as Quaver's view menu: by the mouse on the nearest beat line or
 *  the one before, and live, a column's key at a time while the song plays. */
export type PlacingOptions = {
	nearestTick: boolean,
	/** live notes snapped to the beat snap (only while playing) */
	liveSnap: boolean,
	/** ms added to a live note's time before it is snapped */
	liveOffset: number,
	/** a key held longer than `liveHoldMin` ms places a long note */
	liveHolds: boolean,
	liveHoldMin: number,
};

const DEFAULT_PLACING: PlacingOptions = {
	nearestTick: true, liveSnap: false, liveOffset: 0, liveHolds: true, liveHoldMin: 100,
};

export const placingOptions = new Setting<PlacingOptions>('editor.placing', DEFAULT_PLACING);

export const currentPlacing = (): PlacingOptions => ({
	...DEFAULT_PLACING, ...placingOptions.get(),
});
