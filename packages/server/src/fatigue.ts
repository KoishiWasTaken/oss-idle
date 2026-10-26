import { eq } from 'drizzle-orm';

import { afterPlay } from '@oss-idle/shared/fatigue';

import { db } from './db/client';
import type { ServerRuleset } from './rulesets/ruleset';

/** Plays are one at a time per character, so the read and write need no lock. */
export const addFatigue = async (
	{ profile }: ServerRuleset,
	characterId: number,
	minutes: number,
	strained: number,
	now: number,
) => {
	const [row] = await db.select({ fatigue: profile.fatigue })
		.from(profile)
		.where(eq(profile.id, characterId))
		.limit(1);
	const fatigue = afterPlay(row?.fatigue ?? undefined, minutes, strained, now);
	await db.update(profile).set({ fatigue }).where(eq(profile.id, characterId));
};
