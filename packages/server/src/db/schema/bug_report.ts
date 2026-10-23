import {
	int,
	json,
	mysqlEnum,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core';
import { BUG_STATUS } from '@oss-idle/shared/bugs';
import { users } from './user';

/** A player's bug report, from the game's options; its description is the first message. */
export const bugReports = mysqlTable('bug_report', {
	id: int().autoincrement().primaryKey(),
	userId: int().notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: varchar({ length: 120 }).notNull(),
	status: mysqlEnum(BUG_STATUS).notNull().default('open'),
	version: varchar({ length: 32 }).notNull(),
	client: varchar({ length: 500 }).notNull(),
	createdAt: timestamp().notNull().defaultNow(),
	/** the last message */
	updatedAt: timestamp().notNull().defaultNow(),
	/** the last message id the reporter has seen */
	reporterSeen: int().notNull().default(0),
});

export const bugMessages = mysqlTable('bug_report_message', {
	id: int().autoincrement().primaryKey(),
	reportId: int().notNull()
		.references(() => bugReports.id, { onDelete: 'cascade' }),
	authorId: int().notNull(),
	body: text().notNull(),
	/** upload paths */
	images: json().$type<string[]>().notNull(),
	/** the status this message set */
	status: mysqlEnum(BUG_STATUS),
	createdAt: timestamp().notNull().defaultNow(),
});
