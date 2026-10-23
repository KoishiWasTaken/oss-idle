import { eq } from 'drizzle-orm';
import { afterPlay } from '@oss-idle/shared/fatigue';
import type CharacterBot from '@oss-idle/shared/sim/bots/character';
import { PHYSICAL_SKILLS } from '@oss-idle/shared/skills';
import { db } from './db/client';
import { characters } from './db/schema/character';

// The heaviest maps blame the physical skills for about this share of their notes.
const FULL_STRAIN_SHARE = 0.4;

/** Minutes of a play the physical skills were strained for. */
export const playStrain = (bot: CharacterBot, lengthMs: number): number => {
	const shares = bot.strainShares();
	const share = PHYSICAL_SKILLS.reduce((sum, s) => sum + (shares[s] ?? 0), 0);
	return Math.min(1, share / FULL_STRAIN_SHARE) * lengthMs / 60_000;
};

/** Plays are one at a time per character, so the read and write need no lock. */
export const addFatigue = async (
	characterId: number,
	minutes: number,
	strained: number,
	now: number,
) => {
	const [row] = await db.select({ fatigue: characters.fatigue })
		.from(characters)
		.where(eq(characters.id, characterId))
		.limit(1);
	const fatigue = afterPlay(row?.fatigue ?? undefined, minutes, strained, now);
	await db.update(characters).set({ fatigue }).where(eq(characters.id, characterId));
};
