import { eq } from 'drizzle-orm';
import {
	int,
	mysqlTable,
	primaryKey,
	varchar,
} from 'drizzle-orm/mysql-core';

import type { ServerRuleset } from '../../rulesets/ruleset';
import { db } from '../client';
import { characters } from './character';

/** Highest chat-announced level per (character, skill). Never lowered, so a
 *  character that resets its levels re-climbs without re-announcing. */
export const milestonesTable = (name: string) => mysqlTable(name as 'skill_milestone', {
	characterId: int().notNull()
		.references(() => characters.id, { onDelete: 'cascade' }),
	skill: varchar({ length: 32 }).notNull(),
	level: int().notNull(),
}, table => [
	primaryKey({ columns: [table.characterId, table.skill] }),
]);

export type MilestonesTable = ReturnType<typeof milestonesTable>;
export type SkillMilestoneRow = MilestonesTable['$inferSelect'];

export const getSkillMilestones = async (
	{ milestones: skillMilestones }: ServerRuleset,
	characterId: number,
) => {
	const rows = await db
		.select()
		.from(skillMilestones)
		.where(eq(skillMilestones.characterId, characterId));
	return new Map(rows.map(r => [r.skill, r.level]));
};

export const setSkillMilestone = async (
	{ milestones: skillMilestones }: ServerRuleset,
	characterId: number,
	skill: string,
	level: number,
) => db
	.insert(skillMilestones)
	.values({
		characterId, skill, level,
	})
	.onDuplicateKeyUpdate({ set: { level } });
