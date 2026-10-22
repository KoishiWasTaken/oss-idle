import Synced from '@oss-idle/shared/helpers/synced';
import {
	cleanMods,
	toggleMod,
	type Mod,
} from '@oss-idle/shared/mods';
import { SETTINGS } from '../db/settings';
import type { PlayContext } from '../online/play';

/** The mods picked in song select: the next play takes them. */
export const selectedMods = new Synced<Mod[]>([]);
void SETTINGS.mods.sync(mods => void selectedMods.set(cleanMods(mods)));

export const pickMod = (mod: Mod): void =>
	void SETTINGS.mods.set(toggleMod(selectedMods.get(), mod));

export const resetMods = (): void => void SETTINGS.mods.set([]);

/** The mods a play runs with. A debug play has no session: it takes the ones picked. */
export const modsOfPlay = (play: PlayContext): Mod[] =>
	play.mode === 'debug' ? selectedMods.get() : play.mods;
