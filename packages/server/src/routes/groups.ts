import {
	and,
	eq,
	isNull,
	or,
} from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import {
	GROUPS,
	OWNER_ID,
} from '@oss-idle/shared/groups';

import { db } from '../db/client';
import { characters } from '../db/schema/character';
import { users } from '../db/schema/user';
import { userGroups } from '../db/schema/user_group';
import {
	cardColumns,
	playerCards,
} from '../playerCards';

const group = z.enum(GROUPS);

/** osu!web's group pages: a group's members, public. */
export const groupsRoutes = new Hono()
	.get('/:group', async c => {
		const g = group.parse(c.req.param('group'));
		const rows = await db
			.selectDistinct(cardColumns)
			.from(users)
			.innerJoin(characters, eq(characters.id, users.currentCharacter))
			.leftJoin(userGroups, and(eq(userGroups.userId, users.id), eq(userGroups.group, g)))
			.where(and(
				isNull(users.restrictedAt),
				g === 'admin' ? or(eq(users.id, OWNER_ID), eq(userGroups.group, g)) : eq(userGroups.group, g),
			));
		return c.json(await playerCards(rows));
	});
