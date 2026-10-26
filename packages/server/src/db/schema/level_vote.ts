import {
	int,
	mysqlTable,
	primaryKey,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core';

/** A difficulty players vote skill levels on, to calibrate the level scale. */
export const levelMapsTable = (name: string) => mysqlTable(name as 'level_map', {
	beatmapId: int().primaryKey(),
	// skills nobody votes on for this map, comma-separated
	disabled: varchar({ length: 255 }).notNull().default(''),
	// the result the votes are for, as admins word it: "for a 96-97% clear", "for an SS"
	target: varchar({ length: 64 }).notNull().default(''),
	addedBy: int().notNull(),
	createdAt: timestamp().notNull().defaultNow(),
});

/** The level a player thinks a skill needs to clear a calibration map. Kept when the map is taken off. */
export const levelVotesTable = (name: string) => mysqlTable(name as 'level_vote', {
	beatmapId: int().notNull(),
	userId: int().notNull(),
	skill: varchar({ length: 32 }).notNull(),
	level: int().notNull(),
	updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
}, table => [primaryKey({ columns: [table.beatmapId, table.userId, table.skill] })]);
