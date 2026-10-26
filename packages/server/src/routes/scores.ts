import {
	and,
	desc,
	eq,
	inArray,
	isNull,
} from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import { betterScore } from '@oss-idle/shared/scoreOrder';

import {
	requireAuth,
	sessionUserId,
} from '../auth/middleware';
import {
	setColumns,
	withStatus,
} from '../beatmaps/catalog';
import {
	hasUnrankedBoard,
	unrankedBoard,
} from '../beatmaps/unrankedBoard';
import { db } from '../db/client';
import {
	beatmapListColumns,
	beatmaps,
} from '../db/schema/beatmap';
import { beatmapset } from '../db/schema/beatmapset';
import {
	characters,
	currentCharacterOf,
	resolveAvatarUrl,
} from '../db/schema/character';
import {
	type ScoreRow,
	toScoreDTO,
} from '../db/schema/score';
import { users } from '../db/schema/user';
import {
	beatmapPageIds,
	beatmapRank,
	PAGE_SIZE,
} from '../rankings';
import { rulesetOfBeatmap } from '../rulesets/registry';
import { rulesetQuery } from '../rulesets/request';
import type { ServerRuleset } from '../rulesets/ruleset';
import { friendCharacterIds } from '../social';
import {
	idParam,
	valid,
} from '../validate';


/** Hydrate ranked character ids into their `best` rows on a beatmap, in rank order.
 *  A player's unranked map has its own board instead: global only, no countries. */
async function beatmapLeaderboard(
	r: ServerRuleset,
	beatmapId: number,
	page: number,
	country?: string,
) {
	const { best } = r;
	if (await hasUnrankedBoard(beatmapId)) {
		return country ? [] : unrankedBoard(r, beatmapId, undefined, page);
	}
	const ids = await beatmapPageIds(r, beatmapId, page, country);
	if (ids.length === 0) return [];
	const rows = await db
		.select()
		.from(best)
		.where(and(eq(best.beatmapId, beatmapId), inArray(best.characterId, ids)));
	const byCharacter = new Map(rows.map(r => [r.characterId, r]));
	return ids.map(id => byCharacter.get(id)).filter((r): r is NonNullable<typeof r> => !!r);
}

/** The signed-in character's own best on this beatmap, with its rank (global or
 *  within a country) - shown below the leaderboard even when outside the top 50. */
async function myBeatmapScore(userId: number, beatmapId: number, country?: string) {
	const character = (await currentCharacterOf(userId))?.character;
	const r = await rulesetOfBeatmap(beatmapId);
	if (!character || !r) return null;
	const { best } = r;
	if (await hasUnrankedBoard(beatmapId)) {
		return country ? null : myUnrankedScore(r, character.id, beatmapId);
	}

	const [row] = await db
		.select()
		.from(best)
		.where(and(eq(best.beatmapId, beatmapId), eq(best.characterId, character.id)))
		.limit(1);
	if (!row) return null;

	const rank = await beatmapRank(r, beatmapId, character.id, country);
	return {
		score: toScoreDTO(row, r.def), rank, 
	};
}

const boardQuery = valid('query', z.object({
	country: z.string().length(2).optional(),
	friends: z.literal('1').optional(),
}));

/** The character's own score on an unranked map's board, with its place there. */
async function myUnrankedScore(r: ServerRuleset, characterId: number, beatmapId: number) {
	const board = await unrankedBoard(r, beatmapId, Infinity);
	const at = board.findIndex(row => row.characterId === characterId);
	return at < 0 ? null : {
		score: toScoreDTO(board[at], r.def), rank: at + 1, 
	};
}

/** The bests of the viewer and their friends on a map, in rank order. */
async function friendsBests({ best }: ServerRuleset, beatmapId: number, among: number[]) {
	if (await hasUnrankedBoard(beatmapId)) return [];
	const rows = await db
		.select()
		.from(best)
		.where(and(eq(best.beatmapId, beatmapId), inArray(best.characterId, among.length ? among : [0])));
	return rows.sort((a, b) => betterScore(a, b) ? -1 : 1);
}

/** A map's leaderboard for its web page: each best with who set it. */
export async function beatmapBoard(beatmapId: number, country?: string, among?: number[]) {
	const r = await rulesetOfBeatmap(beatmapId);
	if (!r) return [];
	const rows: ScoreRow[] = among
		? await friendsBests(r, beatmapId, among)
		: await beatmapLeaderboard(r, beatmapId, 1, country);
	const ids = rows.map(r => r.characterId);
	const players = ids.length ? await db
		.select({
			id: characters.id,
			userId: users.id,
			name: characters.name,
			country: users.country,
			avatarUrl: characters.avatarUrl,
			osuAvatarUrl: users.avatarUrl,
		})
		.from(characters)
		.innerJoin(users, eq(users.id, characters.userId))
		.where(and(inArray(characters.id, ids), isNull(users.restrictedAt))) : [];
	const byId = new Map(players.map(p => [p.id, p]));
	return rows.flatMap(row => {
		const p = byId.get(row.characterId);
		if (!p) return [];
		return [{
			score: toScoreDTO(row, r.def),
			player: {
				id: p.id,
				userId: p.userId,
				name: p.name,
				country: p.country,
				avatarUrl: resolveAvatarUrl(p.avatarUrl, p.osuAvatarUrl),
			},
		}];
	}).slice(0, PAGE_SIZE);
}

/** A map's leaderboard page one, as the game shows it. */
const boardOf = async (beatmapId: number, country?: string) => {
	const r = await rulesetOfBeatmap(beatmapId);
	if (!r) return [];
	return (await beatmapLeaderboard(r, beatmapId, 1, country)).map(row => toScoreDTO(row, r.def));
};

export const scoresRoutes = new Hono()
	// the web map page: global, one country, or the viewer's friends
	.get('/beatmap/:beatmap/board', boardQuery, async c => {
		const { country, friends } = c.req.valid('query');
		const viewer = friends ? await sessionUserId(c) : undefined;
		const among = viewer === undefined ? undefined : await friendCharacterIds(viewer);
		if (friends && !among) return c.json([]);
		return c.json(await beatmapBoard(idParam.parse(c.req.param('beatmap')), country, among));
	})
	// the web score page: the score with its map, player and rank on the map, like osu!'s.
	// A score id is its ruleset's: `?ruleset=` says which.
	.get('/:id/show', async c => {
		const id = idParam.parse(c.req.param('id'));
		const r = rulesetQuery(c);
		const { score: scores, best } = r;
		const [row] = await db
			.select({
				score: scores,
				beatmap: beatmapListColumns,
				beatmapset: setColumns(r),
				player: {
					id: characters.id,
					userId: users.id,
					name: characters.name,
					country: users.country,
					avatarUrl: characters.avatarUrl,
					osuAvatarUrl: users.avatarUrl,
				},
			})
			.from(scores)
			.innerJoin(beatmaps, eq(beatmaps.id, scores.beatmapId))
			.innerJoin(beatmapset, eq(beatmapset.id, beatmaps.setId))
			.innerJoin(...withStatus(r))
			.innerJoin(characters, eq(characters.id, scores.characterId))
			.innerJoin(users, eq(users.id, characters.userId))
			.where(and(eq(scores.id, id), isNull(users.restrictedAt)))
			.limit(1);
		if (!row) throw new HTTPException(404, { message: 'Score not found' });

		// only the player's best on the map holds a rank
		const [isBest] = await db.select({ id: best.id }).from(best).where(eq(best.id, id)).limit(1);
		const { osuAvatarUrl, ...player } = row.player;
		return c.json({
			ruleset: r.def.id,
			score: toScoreDTO(row.score, r.def),
			beatmap: row.beatmap,
			beatmapset: row.beatmapset,
			player: {
				...player, avatarUrl: resolveAvatarUrl(player.avatarUrl, osuAvatarUrl), 
			},
			rank: isBest ? await beatmapRank(r, row.score.beatmapId, row.score.characterId) : undefined,
		});
	})
	.get('/:id', async c => {
		const id = idParam.parse(c.req.param('id'));
		const { score: scores } = rulesetQuery(c);

		const [row] = await db.select().from(scores).where(eq(scores.id, id)).limit(1);

		if (!row) throw new HTTPException(404, { message: 'Score not found' });

		return c.json(row);
	})
	// a match player's latest score on the round's map, for the multiplayer ranking
	.get('/character/:character/beatmap/:beatmap/latest', async c => {
		const beatmapId = idParam.parse(c.req.param('beatmap'));
		const r = await rulesetOfBeatmap(beatmapId);
		if (!r) throw new HTTPException(404, { message: 'Score not found' });
		const { score: scores } = r;
		const [row] = await db
			.select()
			.from(scores)
			.where(and(
				eq(scores.characterId, idParam.parse(c.req.param('character'))),
				eq(scores.beatmapId, beatmapId),
			))
			.orderBy(desc(scores.playedAt))
			.limit(1);
		if (!row) throw new HTTPException(404, { message: 'Score not found' });
		return c.json(toScoreDTO(row, r.def));
	})
	.get('/beatmap/:beatmap', async c => c.json(
		await boardOf(idParam.parse(c.req.param('beatmap')))))
	.get('/beatmap/:beatmap/country/:country', async c => c.json(
		await boardOf(idParam.parse(c.req.param('beatmap')), c.req.param('country'))))
	.get('/beatmap/:beatmap/me', requireAuth, async c => c.json(
		await myBeatmapScore(
			c.get('userId'),
			idParam.parse(c.req.param('beatmap')),
		)))
	.get('/beatmap/:beatmap/country/:country/me', requireAuth, async c => c.json(
		await myBeatmapScore(
			c.get('userId'), 
			idParam.parse(c.req.param('beatmap')),
			c.req.param('country'),
		)));
