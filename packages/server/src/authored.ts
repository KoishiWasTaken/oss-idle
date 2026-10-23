/** What add-ons and skins share: an author, a catalog to browse, a deduped download count. */
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
	asc,
	desc,
	eq,
	isNull,
	like,
	or,
	sql,
	type AnyColumn,
	type SQL,
} from 'drizzle-orm';
import { db } from './db/client';
import { users } from './db/schema/user';
import { likeEscape } from './db/columns';
import { addons } from './db/schema/addon';
import { skins } from './db/schema/skin';

/** Map a row to its wire shape with the author's username. */
export const withAuthor = async <R extends { authorId: number }, T>(
	row: R,
	toDTO: (row: R, authorName: string) => T,
) => {
	const [author] = await db
		.select({ username: users.username })
		.from(users)
		.where(eq(users.id, row.authorId))
		.limit(1);
	return toDTO(row, author?.username ?? 'unknown');
};

/** The row when the caller wrote it, or a 404/403 naming it (`Add-on`, `Skin`). */
export const owned = <R extends { authorId: number }>(
	row: R | undefined, userId: number, noun: string,
) => {
	if (!row) throw new HTTPException(404, { message: `${noun} not found` });
	if (row.authorId !== userId) throw new HTTPException(403, { message: `Not your ${noun.toLowerCase()}` });
	return row;
};

type Browsable = {
	name: AnyColumn;
	tags: AnyColumn;
	updatedAt: AnyColumn;
	downloads: AnyColumn;
	publishedAt: AnyColumn;
};

/** A browse query joined on its author: `q` matches name, author or tags, `tag` filters, and
 *  `sort`/`dir` order it, newest published first by default. Restricted authors are left out. */
export const browseQuery = (c: Context, table: Browsable) => {
	const q = c.req.query('q')?.trim();
	const tag = c.req.query('tag')?.trim().toLowerCase();
	const where: SQL[] = [isNull(users.restrictedAt)];
	if (q) {
		const pattern = `%${likeEscape(q)}%`;
		where.push(or(
			like(table.name, pattern), like(users.username, pattern), like(table.tags, pattern),
		)!);
	}
	if (tag) where.push(like(table.tags, `%${likeEscape(tag)}%`));
	const sorts = {
		updated: table.updatedAt, downloads: table.downloads, created: table.publishedAt,
	};
	const sort = sorts[c.req.query('sort') as keyof typeof sorts] ?? sorts.created;
	return {
		where, orderBy: (c.req.query('dir') === 'asc' ? asc : desc)(sort),
	};
};

/** A player's install moves the count only the first time: `inserted` is the downloads row,
 *  which the table's unique key drops for a repeat. */
export const countDownload = async (
	table: typeof addons | typeof skins,
	id: number,
	[inserted]: [{ affectedRows: number }, ...unknown[]],
) => {
	if (inserted.affectedRows > 0) {
		await db.update(table).set({ downloads: sql`${table.downloads} + 1` }).where(eq(table.id, id));
	}
	const [row] = await db.select({ downloads: table.downloads })
		.from(table).where(eq(table.id, id)).limit(1);
	return { downloads: row?.downloads ?? 0 };
};
