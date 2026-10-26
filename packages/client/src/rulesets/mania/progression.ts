import type Character from '../../db/schema/character';
import type { ClientProgression } from '../ruleset';

/** Memory's progress is the maps it has learned: an upgrade forgets one more, a
 *  prestige every one (the scores stay for the profile). */
export const maniaProgression: ClientProgression = {
	afterUpgrade: (character: Character, skill: string) => {
		if (skill !== 'memory') return;
		character.progress.memoryForgetAt = JSON.stringify([...character.memoryForgets(), Date.now()]);
	},
	afterPrestige: (character: Character, skill: string) => {
		if (skill !== 'memory') return;
		character.progress.memoryResetAt = Date.now();
		character.progress.memoryForgetAt = '[]';
	},
};
