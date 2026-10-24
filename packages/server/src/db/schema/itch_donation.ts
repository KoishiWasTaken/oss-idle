import {
	int,
	mysqlTable,
	timestamp,
	varchar,
} from 'drizzle-orm/mysql-core';
import { users } from './user';

/** One itch.io purchase of oss!idle, claimed as supporter on the website. */
export const itchDonations = mysqlTable('itch_donation', {
	// itch.io's purchase id: each one is claimed once
	purchaseId: int().primaryKey(),
	userId: int().references(() => users.id, { onDelete: 'set null' }),
	itchUserId: int().notNull(),
	// as itch.io shows it, e.g. "$5.00"
	price: varchar({ length: 32 }).notNull(),
	currency: varchar({ length: 3 }).notNull(),
	// euro cents, at the day's ECB rate
	amount: int().notNull(),
	seconds: int().notNull(),
	createdAt: timestamp().notNull().defaultNow(),
});
