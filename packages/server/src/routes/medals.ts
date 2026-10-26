import { gt } from 'drizzle-orm';
import { Hono } from 'hono';

import { requireAdmin } from '../auth/admin';
import { db } from '../db/client';
import { getCharacterById } from '../db/schema/character';
import {
	earnedMedals,
	medalHolders,
	medalRules,
} from '../medals';
import { rulesetQuery } from '../rulesets/request';
import type { ServerRuleset } from '../rulesets/ruleset';

/** Who qualifies takes a few hundred queries: cache it for the admin page. */
const QUALIFY_TTL_MS = 10 * 60 * 1000;
type Qualifying = { ruleset: string, at: number, players: number, counts: Map<string, number> };
let qualifying: Qualifying | undefined;

const countQualifying = async (r: ServerRuleset) => {
	const fresh = qualifying && Date.now() - qualifying.at < QUALIFY_TTL_MS;
	if (fresh && qualifying?.ruleset === r.def.id) return qualifying;
	const active = await db.select({ id: r.totals.id })
		.from(r.totals)
		.where(gt(r.totals.playCount, 0));
	const counts = new Map<string, number>();
	for (const { id } of active) {
		const character = await getCharacterById(id);
		if (!character) continue;
		for (const medal of await earnedMedals(r, character)) {
			counts.set(medal, (counts.get(medal) ?? 0) + 1);
		}
	}
	qualifying = {
		ruleset: r.def.id, at: Date.now(), players: active.length, counts,
	};
	return qualifying;
};

export const medalsRoutes = new Hono()
	// Every medal with its rule, how many characters hold it, and how many
	// already qualify (those get it on their next shown result).
	.get('/admin', requireAdmin, async c => {
		const r = rulesetQuery(c);
		const [{ held }, { at, players, counts }] = await Promise.all([
			medalHolders(r),
			countQualifying(r),
		]);
		const rules = medalRules(r);
		return c.json({
			players,
			computedAt: at,
			medals: r.def.medals.medals.map(m => ({
				id: m.id,
				rule: rules[m.id],
				held: held[m.id] ?? 0,
				qualifying: counts.get(m.id) ?? 0,
			})),
		});
	});
