import {
	boolean,
	int,
	mysqlTable,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core';
import { users } from './user';
import { mediumblob } from '../columns';

/** The chat's emoji: Discord's (seeded by ops after deploy), the team's, and one per supporter. */
export const emojis = mysqlTable('emoji', {
	id: int().autoincrement().primaryKey(),
	name: varchar({ length: 32 }).notNull().unique(),
	/** the character it draws, shown as this image when typed as is */
	unicode: varchar({ length: 16 }),
	/** a supporter's own; only they use it unless `shared` */
	ownerId: int().unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	shared: boolean().notNull().default(false),
	type: varchar({ length: 32 }).notNull(),
	image: mediumblob().notNull(),
	createdAt: timestamp().notNull().defaultNow(),
});
