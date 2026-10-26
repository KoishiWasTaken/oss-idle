import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { isRestricted } from '../db/schema/user';
import { requireAuth } from './middleware';

type Env = { Variables: { userId: number } };

/** Require a session whose account still exists and isn't restricted: for what others see. */
export const requireActive = createMiddleware<Env>(async (c, next) => {
	await requireAuth(c, async () => {
		if (await isRestricted(c.get('userId'))) throw new HTTPException(403, { message: 'Your account is restricted' });
		await next();
	});
});
