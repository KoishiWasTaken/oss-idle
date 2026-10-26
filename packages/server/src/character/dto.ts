import type { CharacterDTO } from '@oss-idle/shared/character';

import {
	type CharacterRow,
	characterToDTO,
	profileOf,
} from '../db/schema/character';
import type { UserRow } from '../db/schema/user';
import { selectedRuleset } from '../rulesets/registry';
import type { ServerRuleset } from '../rulesets/ruleset';

/** The character as its client mirrors it: its progress in `r`, by default the ruleset it picked. */
export const characterDTOOf = async (
	row: CharacterRow,
	user: Pick<UserRow, 'avatarUrl' | 'country'>,
	r: ServerRuleset = selectedRuleset(row),
): Promise<CharacterDTO> =>
	characterToDTO(row, await profileOf(r, row.id), r.def, user.avatarUrl, user.country);
