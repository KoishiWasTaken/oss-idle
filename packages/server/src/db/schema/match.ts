import {
	boolean,
	decimal,
	index,
	int,
	mysqlEnum,
	mysqlTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core';

import { Grades } from '@oss-idle/shared/grade';
import { MATCH_EVENT } from '@oss-idle/shared/multiplayer';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';

import { judgeColumns } from './score';

/** A multiplayer match's history: its id is the live match's id. */
export const matches = mysqlTable('mp_match', {
	id: int().autoincrement().primaryKey(),
	name: text().notNull(),
	/** anyone may read the history, not only its players */
	isPublic: boolean().notNull(),
	createdAt: timestamp({ fsp: 3 }).notNull().defaultNow(),
	endedAt: timestamp({ fsp: 3 }),
});

/** A map played in a match. */
export const matchGames = mysqlTable('mp_game', {
	id: int().autoincrement().primaryKey(),
	matchId: int().notNull()
		.references(() => matches.id, { onDelete: 'cascade' }),
	beatmapId: int().notNull(),
	/** the map's ruleset: its scores are in that ruleset's table */
	ruleset: varchar({ length: 16 }).$type<RulesetId>().notNull().default('mania4k'),
	startedAt: timestamp({ fsp: 3 }).notNull().defaultNow(),
	endedAt: timestamp({ fsp: 3 }),
});

/** A ruleset's scores in match games: a match can switch rulesets map to map. */
export const matchScoresTable = <J extends string>(name: string, judgements: readonly J[]) =>
	mysqlTable(name as 'mp_game_score', {
		gameId: int().notNull()
			.references(() => matchGames.id, { onDelete: 'cascade' }),
		characterId: int().notNull(),
		score: int().notNull(),
		maxCombo: int().notNull(),
		accuracy: decimal({
			precision: 10, scale: 8,
		}).notNull(),
		failed: boolean().notNull(),
		grade: mysqlEnum(Grades).notNull().default('D'),
		...judgeColumns(judgements),
	}, t => [primaryKey({ columns: [t.gameId, t.characterId] })]);

export type MatchScoresTable = ReturnType<typeof matchScoresTable<never>>;

/** What happened in a match, in order: joins, leaves, host changes, games. */
export const matchEvents = mysqlTable('mp_event', {
	id: int().autoincrement().primaryKey(),
	matchId: int().notNull()
		.references(() => matches.id, { onDelete: 'cascade' }),
	type: mysqlEnum(MATCH_EVENT).notNull(),
	characterId: int(),
	gameId: int(),
	at: timestamp({ fsp: 3 }).notNull().defaultNow(),
}, t => [index('mp_event_match_idx').on(t.matchId, t.at)]);
