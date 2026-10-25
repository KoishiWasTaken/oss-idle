import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import {
	asc,
	eq,
} from 'drizzle-orm';
import {
	type Emoji,
	EMOJI_MAX_BYTES,
	emojiName,
} from '@oss-idle/shared/community/emoji';
import { db } from '../db/client';
import { emojis } from '../db/schema/emoji';
import { users } from '../db/schema/user';
import { characters } from '../db/schema/character';
import { requireModerator } from '../auth/admin';
import { requireAuth } from '../auth/middleware';
import { isSupporter } from '../supporter';
import {
	idParam,
	valid,
} from '../validate';
import { IMMUTABLE } from '../beatmaps/serve';
import { hub } from '../ws/hub';

// Discord's; svg only comes seeded
const TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const upload = z.object({
	name: emojiName,
	file: z.instanceof(File),
});

const mineUpload = upload.extend({ shared: z.stringbool().default(false) });

const image = async (file: File) => {
	if (!TYPES.includes(file.type)) throw new HTTPException(415, { message: 'PNG, JPEG, GIF or WebP only' });
	if (file.size > EMOJI_MAX_BYTES) throw new HTTPException(413, { message: 'Emoji images are 256 KB at most' });
	return {
		type: file.type, image: Buffer.from(await file.arrayBuffer()),
	};
};

/** Taken by another emoji than `ownerId`'s own. */
const uniqueName = async (name: string, ownerId?: number) => {
	const [taken] = await db.select({ ownerId: emojis.ownerId })
		.from(emojis).where(eq(emojis.name, name)).limit(1);
	if (taken && (ownerId === undefined || taken.ownerId !== ownerId)) {
		throw new HTTPException(409, { message: `:${name}: already exists` });
	}
};

const requireSupporter = async (userId: number) => {
	if (!await isSupporter(userId)) throw new HTTPException(403, { message: 'This needs an oss!supporter tag' });
};

/** The chat's emoji. Everyone reads them; admins and the GMT add, rename and delete any,
 *  a supporter keeps one of their own. */
export const emojiRoutes = new Hono()
	.use(async (c, next) => {
		await next();
		if (c.req.method !== 'GET' && c.res.ok) hub.broadcast({ type: 'emoji:invalidate' });
	})

	.get('/', async c => {
		const rows = await db.select({
			id: emojis.id,
			name: emojis.name,
			unicode: emojis.unicode,
			ownerId: emojis.ownerId,
			shared: emojis.shared,
			characterId: characters.id,
			characterName: characters.name,
		})
			.from(emojis)
			.leftJoin(users, eq(users.id, emojis.ownerId))
			.leftJoin(characters, eq(characters.id, users.currentCharacter))
			.orderBy(asc(emojis.name));
		return c.json(rows.map((r): Emoji => ({
			id: r.id,
			name: r.name,
			...r.unicode ? { unicode: r.unicode } : {},
			...r.ownerId ? {
				owner: {
					userId: r.ownerId,
					characterId: r.characterId ?? undefined,
					name: r.characterName ?? undefined,
				},
				shared: r.shared,
			} : {},
		})));
	})

	// a supporter's own: a new image is a new emoji
	.put('/mine', requireAuth, valid('form', mineUpload), async c => {
		const userId = c.get('userId');
		await requireSupporter(userId);
		const { name, file, shared } = c.req.valid('form');
		const values = {
			name, shared, ownerId: userId, ...await image(file),
		};
		await uniqueName(name, userId);
		const id = await db.transaction(async tx => {
			await tx.delete(emojis).where(eq(emojis.ownerId, userId));
			const [created] = await tx.insert(emojis).values(values);
			return created.insertId;
		});
		return c.json({
			id, name,
		});
	})

	// the name is a supporter's to change; sharing it stays theirs after the tag ends
	.patch('/mine', requireAuth, valid('json', z.object({
		name: emojiName.optional(),
		shared: z.boolean().optional(),
	})), async c => {
		const userId = c.get('userId');
		const { name, shared } = c.req.valid('json');
		if (name !== undefined) {
			await requireSupporter(userId);
			await uniqueName(name, userId);
		}
		const [updated] = await db.update(emojis).set({
			name, shared,
		}).where(eq(emojis.ownerId, userId));
		if (!updated.affectedRows) throw new HTTPException(404, { message: 'No emoji of your own' });
		return c.json({ ok: true });
	})

	.delete('/mine', requireAuth, async c => {
		await db.delete(emojis).where(eq(emojis.ownerId, c.get('userId')));
		return c.json({ ok: true });
	})

	// an emoji's image never changes: a new one is a new id
	.get('/:id', async c => {
		const [row] = await db.select({
			type: emojis.type, image: emojis.image, 
		})
			.from(emojis).where(eq(emojis.id, idParam.parse(c.req.param('id')))).limit(1);
		if (!row) throw new HTTPException(404, { message: 'No such emoji' });
		return c.body(new Uint8Array(row.image), 200, {
			'Content-Type': row.type,
			'Cache-Control': IMMUTABLE,
			'X-Content-Type-Options': 'nosniff',
			'Content-Security-Policy': 'sandbox',
		});
	})

	.post('/', requireModerator, valid('form', upload), async c => {
		const { name, file } = c.req.valid('form');
		const values = {
			name, ...await image(file),
		};
		await uniqueName(name);
		const [created] = await db.insert(emojis).values(values);
		return c.json({
			id: created.insertId, name, 
		}, 201);
	})

	.patch('/:id', requireModerator, valid('json', z.object({ name: emojiName })), async c => {
		const id = idParam.parse(c.req.param('id'));
		const { name } = c.req.valid('json');
		await uniqueName(name);
		const [updated] = await db.update(emojis).set({ name }).where(eq(emojis.id, id));
		if (!updated.affectedRows) throw new HTTPException(404, { message: 'No such emoji' });
		return c.json({
			id, name, 
		});
	})

	.delete('/:id', requireModerator, async c => {
		const [deleted] = await db.delete(emojis).where(eq(emojis.id, idParam.parse(c.req.param('id'))));
		if (!deleted.affectedRows) throw new HTTPException(404, { message: 'No such emoji' });
		return c.json({ ok: true });
	});
