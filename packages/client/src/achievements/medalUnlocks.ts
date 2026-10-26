import { medalLook } from '@oss-idle/shared/achievements/catalogue';
import type { MedalLook } from '@oss-idle/shared/achievements/medal';

import {
	medalDescription,
	medalName,
} from '../rulesets/registry';
import { anyMedal } from '../rulesets/registry';

export type MedalUnlock = {
	id: string,
	name: string,
	description: string,
	look: MedalLook,
	/** hush-hush: revealed from a "?" face */
	secret?: boolean,
};

/** What the unlock overlay shows for medal ids, unknown ids skipped. */
export const medalUnlocks = (ids: readonly string[]): MedalUnlock[] => ids.flatMap(id => {
	const medal = anyMedal(id);
	if (!medal) return [];
	return [{
		id,
		name: medalName(id),
		description: medalDescription(id),
		look: medalLook(medal),
		secret: medal.category === 'secret' || undefined,
	}];
});
