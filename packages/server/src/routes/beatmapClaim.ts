import {
	and,
	asc,
	eq,
	isNotNull,
	isNull,
	ne,
} from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import { INTRO_SET_ID } from '@oss-idle/shared/beatmap';

import { requireActive } from '../auth/active';
import { requireAdmin } from '../auth/admin';
import { requireAuth } from '../auth/middleware';
import {
	liveCondition,
	withStatus,
} from '../beatmaps/catalog';
import { db } from '../db/client';
import { beatmapClaims } from '../db/schema/beatmap_request';
import { beatmapset } from '../db/schema/beatmapset';
import { users } from '../db/schema/user';
import { pushMedals } from '../medals';
import { enabledRulesets } from '../rulesets/registry';
import { rulesetFor } from '../rulesets/registry';
import {
	idParam,
	valid,
} from '../validate';

/** Claims are for the 4K maps ranked before the queue existed: no other ruleset had any. */
const claimed = () => rulesetFor('mania4k');

// ponytail: temporary, for maps proposed on Discord before the queue existed - drop with beatmap_claim once settled.


const selectionBody = z.object({ setIds: z.array(idParam).max(1000) });

/** Ranked osu! sets nobody proposed, so still counted for Adri. */
const unclaimedSets = () => db
	.select({
		setId: beatmapset.id,
		osuId: beatmapset.osuId,
		artist: beatmapset.artist,
		title: beatmapset.title,
		creator: beatmapset.creator,
	})
	.from(beatmapset)
	.innerJoin(...withStatus(claimed()))
	.leftJoin(claimed().requests, eq(claimed().requests.setId, beatmapset.osuId))
	.where(and(
		liveCondition(claimed()),
		isNotNull(beatmapset.osuId),
		isNull(claimed().requests.setId),
		ne(beatmapset.id, INTRO_SET_ID),
	))
	.orderBy(asc(beatmapset.artist), asc(beatmapset.title));

export const beatmapClaimRoutes = new Hono()
	.get('/', requireAuth, async c => {
		const [maps, mine] = await Promise.all([
			unclaimedSets(),
			db.select({ setId: beatmapClaims.setId })
				.from(beatmapClaims)
				.where(eq(beatmapClaims.userId, c.get('userId'))),
		]);
		return c.json({
			maps, mine: mine.map(row => row.setId),
		});
	})

	// The player's whole selection, replacing what they claimed before.
	.put('/', requireActive, valid('json', selectionBody), async c => {
		const userId = c.get('userId');
		const open = new Set((await unclaimedSets()).map(set => set.setId));
		const setIds = [...new Set(c.req.valid('json').setIds)].filter(id => open.has(id));
		await db.transaction(async tx => {
			await tx.delete(beatmapClaims).where(eq(beatmapClaims.userId, userId));
			if (setIds.length) await tx.insert(beatmapClaims).values(setIds.map(setId => ({
				setId, userId, 
			})));
		});
		return c.json({ setIds });
	})

	.get('/admin', requireAdmin, async c => c.json(await db
		.select({
			setId: beatmapClaims.setId,
			userId: beatmapClaims.userId,
			username: users.username,
			characterId: users.currentCharacter,
			registeredAt: users.createdAt,
			createdAt: beatmapClaims.createdAt,
			rankedAt: claimed().setStatus.rankedAt,
			osuId: beatmapset.osuId,
			artist: beatmapset.artist,
			title: beatmapset.title,
			creator: beatmapset.creator,
		})
		.from(beatmapClaims)
		.innerJoin(beatmapset, eq(beatmapset.id, beatmapClaims.setId))
		.leftJoin(...withStatus(claimed()))
		.leftJoin(users, eq(users.id, beatmapClaims.userId))
		.orderBy(asc(beatmapset.artist), asc(beatmapset.title), asc(beatmapClaims.createdAt))))

	// Attribute the set to this claimer, as if they had proposed it through the queue.
	.post('/:setId/:userId', requireAdmin, async c => {
		const setId = idParam.parse(c.req.param('setId'));
		const userId = idParam.parse(c.req.param('userId'));
		const [set] = await db
			.select({
				osuId: beatmapset.osuId, artist: beatmapset.artist, title: beatmapset.title, creator: beatmapset.creator,
			})
			.from(beatmapset)
			.where(eq(beatmapset.id, setId));
		if (!set?.osuId) throw new HTTPException(404, { message: 'No such osu! set' });
		const { osuId, ...meta } = set;

		// Requests are keyed by osu! set id; the claim by ours.
		await db.transaction(async tx => {
			await tx.insert(claimed().requests).values({
				setId: osuId,
				userId,
				...meta,
				status: 'accepted',
				resolvedAt: new Date(),
				resolvedBy: c.get('userId'),
			});
			await tx.insert(claimed().requestVotes).values({
				setId: osuId, userId,
			});
			await tx.delete(beatmapClaims).where(eq(beatmapClaims.setId, setId));
		});
		const [claimer] = await db.select({ characterId: users.currentCharacter })
			.from(users)
			.where(eq(users.id, userId));
		if (claimer?.characterId) {
			for (const r of enabledRulesets()) await pushMedals(r, claimer.characterId);
		}
		return c.json({ ok: true });
	})

	.delete('/:setId/:userId', requireAdmin, async c => {
		const setId = idParam.parse(c.req.param('setId'));
		const userId = idParam.parse(c.req.param('userId'));
		await db.delete(beatmapClaims)
			.where(and(eq(beatmapClaims.setId, setId), eq(beatmapClaims.userId, userId)));
		return c.json({ ok: true });
	});

