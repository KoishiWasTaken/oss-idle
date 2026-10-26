import { Hono } from 'hono';

import { db } from '../db/client';
import {
	getOnline,
	getPlaying,
} from '../play';
import { enabledRulesets } from '../rulesets/registry';

/** Plays stored, every ruleset's. */
const scoreCount = async () => (await Promise.all(enabledRulesets().map(async ({ score }) =>
	(await db.select({ nb: max(score.id) }).from(score))[0].nb ?? 0))).reduce((a, b) => a + b, 0);
import { max } from 'drizzle-orm';
import { z } from 'zod';

import { VERSION } from '@oss-idle/shared/version';

import { requireAdmin } from '../auth/admin';
import { dashboard } from '../dashboard';
import { characters } from '../db/schema/character';
import {
	apiBaseUrl,
	env,
} from '../env';
import {
	clientIp,
	continentOf,
} from '../geo';
import { timing } from '../metrics';
import { clientCount } from '../queue';
import { rateLimit } from '../rateLimit';
import { getStats } from '../stats';
import { valid } from '../validate';
import {
	adoptionBreakdown,
	presenceCount,
} from '../ws/presence';

/** The API origins players can be on: the API itself and its edges. */
const apiHosts = () => [apiBaseUrl, ...env.API_EDGES].map(url => new URL(url).host);

/** Round trips the game measured to each origin while picking the nearest. */
const rttBody = z.object({
	samples: z.array(z.object({
		host: z.string().max(100),
		ms: z.number().min(0).max(60_000),
	})).max(8),
});

export const statsRoutes = new Hono()
	.get('/general', async c => c.json({
		playing: await getPlaying(),
		online: await getOnline(),
		scores: await scoreCount(),
		users: (await db.select({ nb: max(characters.id) }).from(characters))[0].nb ?? 0,
	}))
	.get('/recent', async c => c.json(await getStats()))
	.get('/version', async c => c.json(VERSION))
	.get('/admin', requireAdmin, async c => c.json({
		serverVersion: VERSION,
		online: await presenceCount(),
		clients: await clientCount(),
		playing: await getPlaying(),
		players: (await db.select({ nb: max(characters.id) }).from(characters))[0].nb ?? 0,
		scores: await scoreCount(),
		adoption: await adoptionBreakdown(),
	}))
	.get('/admin/metrics', requireAdmin, async c => c.json(await dashboard(apiHosts())))
	.post('/rtt', rateLimit('rtt', 20), valid('json', rttBody), async c => {
		const hosts = apiHosts();
		const continent = await continentOf(clientIp(c)) ?? '??';
		for (const { host, ms } of c.req.valid('json').samples) {
			if (hosts.includes(host)) timing(`rtt:${host}`, ms, `${continent}:`);
		}
		return c.body(null, 204);
	})
;