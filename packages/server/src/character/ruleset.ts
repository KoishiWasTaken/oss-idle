import {
	and,
	desc,
	eq,
	isNull,
	lt,
	or,
} from 'drizzle-orm';

import { db } from '../db/client';
import {
	type CharacterRow,
	characters,
} from '../db/schema/character';
import type { ServerRuleset } from '../rulesets/ruleset';

/** Who plays a map of the ruleset for this character: itself, or - a reborn character
 *  locked to another ruleset - the account's newest earlier character that may. */
export const playerFor = async (
	character: CharacterRow,
	r: ServerRuleset,
): Promise<CharacterRow | undefined> => {
	if (!character.rulesetLock || character.rulesetLock === r.def.id) return character;
	const [previous] = await db.select().from(characters)
		.where(and(
			eq(characters.userId, character.userId),
			lt(characters.id, character.id),
			or(isNull(characters.rulesetLock), eq(characters.rulesetLock, r.def.id)),
		))
		.orderBy(desc(characters.id))
		.limit(1);
	return previous;
};
