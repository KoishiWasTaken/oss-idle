import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { sessionUserId } from '../auth/middleware';
import { matchHistory } from '../matchHistory';
import { idParam } from '../validate';


export const matchesRoutes = new Hono()
	// a match's history: public, or for its players only
	.get('/:id', async c => {
		const history = await matchHistory(idParam.parse(c.req.param('id')), await sessionUserId(c));
		if (!history) throw new HTTPException(404, { message: 'Match not found' });
		return c.json(history);
	});
