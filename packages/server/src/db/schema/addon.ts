import {
	boolean,
	int,
	longtext,
	mediumtext,
	mysqlTable,
	text,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/mysql-core';
import {
	ADDON_BUILD_STATUS,
	ADDON_KIND,
	ADDON_TYPE,
	parseAddonTypes,
	ADDON_STATUS,
	type AddonBuildStatus,
	type AddonKind,
	type AddonStatus,
} from '@oss-idle/shared/addon';
import { users } from './user';
import { splitTags } from '../columns';

export const addons = mysqlTable('addons', {
	id: int().autoincrement().primaryKey(),
	authorId: int().notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: varchar({ length: 80 }).notNull(),
	description: varchar({ length: 500 }).notNull().default(''),
	tags: varchar({ length: 255 }).notNull().default(''), // comma-separated
	types: varchar({ length: 32 }).notNull().default(ADDON_TYPE.gameplay), // comma-separated
	icon: varchar({ length: 512 }), // uploaded image path, null → no icon
	version: varchar({ length: 20 }).notNull().default('0.1.0'),
	gameVersion: varchar({ length: 20 }).notNull(),
	source: longtext().notNull(),
	reviewedSource: longtext(), // source as it was at the last moderation, null → never reviewed
	// the approved release players get while edits await review, null → not live
	publishedSource: longtext(),
	publishedVersion: varchar({ length: 20 }),
	publishedGameVersion: varchar({ length: 20 }),
	status: varchar({ length: 20 }).notNull().default(ADDON_STATUS.unpublished),
	feedback: text(), // admin moderation note, null → none
	downloads: int().notNull().default(0), // unique installs, one per player
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
	publishedAt: timestamp(), // null until first published
	kind: varchar({ length: 10 }).notNull().default(ADDON_KIND.inline),
	repoUrl: varchar({ length: 512 }),
	hookSecret: varchar({ length: 64 }),
	trusted: boolean().notNull().default(false), // repo builds go live without review
	// what `source` was built from, and the live one
	commit: varchar({ length: 40 }),
	tag: varchar({ length: 100 }),
	publishedCommit: varchar({ length: 40 }),
	publishedTag: varchar({ length: 100 }),
	sourceDiff: longtext(), // repo diff from publishedCommit to commit, by the builder
	buildStatus: varchar({ length: 10 }).notNull().default(ADDON_BUILD_STATUS.idle),
	buildLog: mediumtext(),
	buildAt: timestamp(), // queued or claimed at
});

// One row per (add-on, player) - the unique key makes a repeat install a no-op,
// so `addons.downloads` counts distinct players, not raw install clicks.
export const addonDownloads = mysqlTable('addon_downloads', {
	id: int().autoincrement().primaryKey(),
	addonId: int().notNull()
		.references(() => addons.id, { onDelete: 'cascade' }),
	userId: int().notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	downloadedAt: timestamp().notNull().defaultNow(),
}, t => [unique().on(t.addonId, t.userId)]);

export type AddonRow = typeof addons.$inferSelect;
export type NewAddonRow = typeof addons.$inferInsert;

/** Where a repo add-on's builds come from and stand. */
const repoOf = (row: AddonRow) => ({
	kind: row.kind as AddonKind,
	repoUrl: row.repoUrl ?? undefined,
	trusted: row.trusted,
	commit: row.commit ?? undefined,
	tag: row.tag ?? undefined,
	publishedCommit: row.publishedCommit ?? undefined,
	publishedTag: row.publishedTag ?? undefined,
	sourceDiff: row.sourceDiff ?? undefined,
	buildStatus: row.buildStatus as AddonBuildStatus,
	buildLog: row.buildLog ?? undefined,
});

/**
 * Map an add-on row (+ resolved author name) to the wire shape. This return type
 * is the single source of the contract - client/web infer it off the route with
 * `InferResponseType`, no parallel DTO declaration.
 */
export const toAddonDTO = (row: AddonRow, authorName: string) => {
	return {
		id: row.id,
		authorId: row.authorId,
		authorName,
		name: row.name,
		description: row.description,
		tags: splitTags(row.tags),
		types: parseAddonTypes(row.types),
		icon: row.icon ?? null,
		version: row.version,
		gameVersion: row.gameVersion,
		source: row.source,
		publishedVersion: row.publishedVersion ?? null,
		status: row.status as AddonStatus,
		feedback: row.feedback ?? null,
		downloads: row.downloads,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
		publishedAt: row.publishedAt?.toISOString() ?? null,
		...repoOf(row),
	};
};

export type AddonDTO = ReturnType<typeof toAddonDTO>;

/** The public face of a live add-on: its approved release, not the edits under review. */
export const toLiveAddonDTO = (row: AddonRow, authorName: string): AddonDTO => ({
	...toAddonDTO(row, authorName),
	source: row.publishedSource!,
	version: row.publishedVersion!,
	gameVersion: row.publishedGameVersion!,
	status: ADDON_STATUS.published,
	commit: row.publishedCommit ?? undefined,
	tag: row.publishedTag ?? undefined,
	sourceDiff: undefined,
	buildStatus: ADDON_BUILD_STATUS.idle,
	buildLog: undefined,
});