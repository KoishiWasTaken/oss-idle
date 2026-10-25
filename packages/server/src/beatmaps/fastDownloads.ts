import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import {
	supporterActive,
	users,
} from '../db/schema/user';
import { sessionUserId } from '../auth/middleware';
import { ipKey } from '../rateLimit';
import { redis } from '../redis';
import { redisKeyPrefix } from '../env';

/** Sets a non-supporter downloads at full speed a day; the rest still download, slower. */
export const FAST_DOWNLOADS_PER_DAY = 100;

const DAY = 86_400_000;

/** Who the day's count is for: the account, or the address when signed out. Undefined: no cap. */
const capped = async (c: Context): Promise<string | undefined> => {
	const userId = await sessionUserId(c);
	if (!userId) return ipKey(c) && `ip:${ipKey(c)}`;
	const [user] = await db
		.select({
			supporterUntil: users.supporterUntil, createdAt: users.createdAt,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	const signupDay = !!user && Date.now() - user.createdAt.getTime() < DAY;
	if (supporterActive(user) || signupDay) return undefined;
	return `user:${userId}`;
};

/** Does this set go out at full speed? A set already counted today stays fast. */
export const fullSpeed = async (c: Context, setId: number): Promise<boolean> => {
	const who = await capped(c);
	if (!who) return true;
	const key = `${redisKeyPrefix}fastdl:${who}:${Math.floor(Date.now() / DAY)}`;
	const id = String(setId);
	if (await redis.sismember(key, id)) return true;
	if (await redis.scard(key) >= FAST_DOWNLOADS_PER_DAY) return false;
	await redis.sadd(key, id);
	await redis.expire(key, DAY / 1000);
	return true;
};
