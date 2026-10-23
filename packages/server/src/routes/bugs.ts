import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { isAdmin } from '@oss-idle/shared/groups';
import {
	bugMessageBody,
	bugReportBody,
} from '@oss-idle/shared/bugs';
import { requireAuth } from '../auth/middleware';
import { requireAdmin } from '../auth/admin';
import { requireActive } from '../auth/active';
import { groupsOf } from '../groups';
import {
	addBugMessage,
	allBugs,
	bugStatuses,
	bugsOf,
	createBug,
	getBug,
	markBugSeen,
	unreadBugs,
} from '../bugs';
import { saveUploadedImage } from '../uploads';
import {
	idParam,
	valid,
} from '../validate';


const statusQuery = valid('query', z.object({ status: z.string().optional() }));

/** A report its reporter or an admin may read and answer; anyone else gets a 404. */
const readable = async (rawId: string, userId: number) => {
	const report = await getBug(idParam.parse(rawId));
	const admin = isAdmin(await groupsOf(userId));
	if (!report || (report.reporter.userId !== userId && !admin)) {
		throw new HTTPException(404, { message: 'Report not found' });
	}
	return {
		report, admin,
	};
};

export const bugsRoutes = new Hono()
	.get('/', requireAuth, async c => c.json(await bugsOf(c.get('userId'))))

	.post('/', requireActive, valid('json', bugReportBody), async c =>
		c.json({ id: await createBug(c.get('userId'), c.req.valid('json')) }))

	// for the web banner
	.get('/unread', requireAuth, async c => c.json(await unreadBugs(c.get('userId'))))

	// a screenshot for a report or a reply, sent along with it as its path
	.post('/image', requireActive, async c =>
		c.json({ url: await saveUploadedImage((await c.req.parseBody())['file']) }))

	// ?status=open,confirmed
	.get('/admin', requireAdmin, statusQuery, async c => {
		return c.json(await allBugs(bugStatuses(c.req.valid('query').status)));
	})

	.get('/:id', requireAuth, async c => {
		const userId = c.get('userId');
		const { report, admin } = await readable(c.req.param('id'), userId);
		if (report.reporter.userId === userId) await markBugSeen(report.id);
		return c.json({
			...report, canSetStatus: admin,
		});
	})

	.post('/:id/messages', requireActive, valid('json', bugMessageBody), async c => {
		const userId = c.get('userId');
		const { report, admin } = await readable(c.req.param('id'), userId);
		const message = c.req.valid('json');
		if (message.status && !admin) throw new HTTPException(403, { message: 'Forbidden' });
		await addBugMessage(report.id, userId, message);
		return c.json({ ok: true });
	});
