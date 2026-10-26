import AdmZip from 'adm-zip';
import {
	and,
	count,
	eq,
	gte,
	isNotNull,
	isNull,
	type SQL,
} from 'drizzle-orm';

import {
	type BeatmapStatus,
	INTRO_SET_ID,
	isApproved,
	monthlyQuota,
} from '@oss-idle/shared/beatmap';
import { OSU_MODE } from '@oss-idle/shared/rulesets/ids';
import {
	type Chart,
	fileIdsOf,
	OWN_ID_FROM,
	parseChart,
} from '@oss-idle/shared/rulesets/mania/editor/chart';
import {
	checkChart,
	type CheckId,
} from '@oss-idle/shared/rulesets/mania/editor/checks';

import { db } from '../db/client';
import { beatmaps } from '../db/schema/beatmap';
import {
	beatmapset,
	type BeatmapsetRow,
} from '../db/schema/beatmapset';
import { users } from '../db/schema/user';
import { fetchBeatmapset } from '../osu/api';
import { enabledRulesets } from '../rulesets/registry';
import type { ServerRuleset } from '../rulesets/ruleset';
import {
	purgeBeatmapScores,
	repriceBeatmapScores,
} from '../scores';
import { isSupporter } from '../supporter';
import {
	diffsOf,
	liveCondition,
	withStatus,
} from './catalog';
import { creditMapper } from './credit';
import {
	statusesOf,
	statusIn,
	writeStatus,
} from './setStatus';
import { wipeUnrankedScores } from './unrankedBoard';

const MB = 1024 * 1024;

/** What a player's .osz may weigh, packed (the request body) and unpacked. */
export const UPLOAD_MAX = 50 * MB;
// ponytail: trusts the sizes the zip declares (but none of 0 over real data); inflate with a running cap if bombs show up
const UNPACKED_MAX = 150 * MB;

/** What one difficulty may hold: past these, it is no map but a way to tie up the server. */
const CHART_MAX = {
	notes: 100_000, points: 50_000, ms: 2 * 60 * 60 * 1000, 
};

/** A difficulty the editor's checks find errors in. */
export type UploadProblem = { file: string, version: string, checks: CheckId[] };

/** Why an upload was turned down, for the editor to act on. */
export type RefusalCode =
	| 'invalid' | 'checks' | 'quota' | 'notYours' | 'notCreator' | 'ranked' | 'loved' | 'locked' | 'no4k'
	| 'notQueued' | 'notRanked' | 'busy';

export class UploadRefused extends Error {
	constructor(
		message: string,
		public readonly code: RefusalCode,
		public readonly problems: UploadProblem[] = [],
	) {
		super(message);
	}
}

/** A mania difficulty of an upload. */
export type UploadChart = { file: string, text: string, chart: Chart };

/** Refuse an .osz too big unpacked, without mania difficulties, or with a mania difficulty
 *  the editor's map checks find an error in; returns its mania difficulties. Its other
 *  rulesets' difficulties go through as they are. */
export const gateUpload = (buffer: Buffer): UploadChart[] => {
	let zip: AdmZip;
	try {
		zip = new AdmZip(buffer);
	} catch {
		throw new UploadRefused('This is not an .osz file', 'invalid');
	}
	const entries = zip.getEntries();
	// an entry saying it holds nothing inflates without a cap: one with data behind it lies
	const lying = entries.some(entry => entry.header.size === 0 && entry.header.compressedSize > 64);
	if (lying || entries.reduce((total, entry) => total + entry.header.size, 0) > UNPACKED_MAX) {
		throw new UploadRefused('This .osz is too big unpacked', 'invalid');
	}
	let charts: UploadChart[];
	try {
		// the .osu files at its root, as ingest reads them
		charts = entries
			.filter(entry => !entry.entryName.includes('/') && entry.entryName.toLowerCase().endsWith('.osu'))
			.map(entry => ({
				file: entry.entryName, text: entry.getData().toString('utf8'),
			}))
			.filter(({ text }) => Number(/^Mode:\s*(\d+)\s*$/m.exec(text)?.[1] ?? 0) === OSU_MODE.mania)
			.map(({ file, text }) => ({
				file, text, chart: parseChart(text),
			}));
	} catch {
		throw new UploadRefused('This .osz is damaged', 'invalid');
	}
	if (!charts.length) throw new UploadRefused('No osu!mania difficulty in this .osz', 'invalid');
	for (const { chart } of charts) {
		const points = chart.timing.length + chart.scroll.length;
		// spread arguments overflow the stack on a huge chart
		const last = [
			...chart.notes.map(note => note.end ?? note.time),
			...chart.timing.map(point => point.time),
			...chart.scroll.map(point => point.time),
		].reduce((a, b) => Math.max(a, b), 0);
		if (chart.notes.length > CHART_MAX.notes || points > CHART_MAX.points || last > CHART_MAX.ms) {
			throw new UploadRefused(`${chart.metadata.version} is too long or too big`, 'invalid');
		}
	}

	const versions = charts.map(({ chart }) => chart.metadata.version);
	const problems = charts.flatMap(({ file, chart }, i) => {
		const checks = checkChart({
			doc: chart,
			keys: chart.keys,
			// the song's length would need decoding it here; the editor checks it
			audioLength: 0,
			audio: chart.audio,
			background: chart.background,
			otherVersions: versions.filter((_, j) => j !== i),
		}).filter(issue => issue.level === 'error').map(issue => issue.check);
		return checks.length ? [{
			file, version: chart.metadata.version, checks, 
		}] : [];
	});
	if (problems.length) throw new UploadRefused('The map checks found errors', 'checks', problems);
	return charts;
};

const countSets = async (where: SQL | undefined) =>
	(await db.select({ sets: count() }).from(beatmapset).where(where))[0].sets;

/** The player's sets ranked in any ruleset. */
const countRanked = async (userId: number) => {
	const sets = new Set<number>();
	for (const r of enabledRulesets()) {
		const rows = await db.select({ id: beatmapset.id }).from(beatmapset).innerJoin(...withStatus(r))
			.where(and(
				eq(beatmapset.ownerUserId, userId),
				liveCondition(r),
				eq(r.setStatus.status, 'ranked'),
				isNull(beatmapset.deletedAt),
			));
		for (const { id } of rows) sets.add(id);
	}
	return sets.size;
};

/** Refuse a new map once the player has uploaded this month's fill. Taking one down
 *  gives no slot back; updating a map takes none. */
export const checkQuota = async (userId: number): Promise<void> => {
	const now = new Date();
	const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
	const mine = eq(beatmapset.ownerUserId, userId);
	const [uploaded, ranked, supporter] = await Promise.all([
		// what they put up, not the osu! maps credited to them
		countSets(and(mine, isNotNull(beatmapset.uploadedAt), gte(beatmapset.createdAt, monthStart))),
		countRanked(userId),
		isSupporter(userId),
	]);
	const quota = monthlyQuota(ranked, supporter);
	if (uploaded >= quota) throw new UploadRefused(`You have uploaded your ${quota} new maps this month`, 'quota');
};

/** The set a file's BeatmapSetID names: ours from 1e9, osu!'s below. A deleted set of
 *  ours is gone (its map comes back as a new one); one from osu! keeps its osu! id, so
 *  it comes back itself. */
const setOfFileId = async (fileSetId: number): Promise<BeatmapsetRow | undefined> => {
	const [set] = await db.select().from(beatmapset).where(fileSetId >= OWN_ID_FROM
		? and(eq(beatmapset.id, fileSetId), isNull(beatmapset.deletedAt))
		: eq(beatmapset.osuId, fileSetId)).limit(1);
	return set;
};

/** Whose the set is: its uploader, or the mapper of a map from osu! - asked of osu!
 *  when it was never credited. */
const ownerOf = async (set: BeatmapsetRow): Promise<number | undefined> => {
	if (set.ownerUserId !== null || set.osuId === null) return set.ownerUserId ?? undefined;
	await creditMapper(set.id, set.osuId);
	const [row] = await db.select({ owner: beatmapset.ownerUserId }).from(beatmapset)
		.where(eq(beatmapset.id, set.id)).limit(1);
	return row?.owner ?? undefined;
};

/** The player's own set `setId` (theirs to manage), in any state; refused when it isn't theirs. */
export const ownSet = async (setId: number, userId: number) => {
	const [set] = await db.select().from(beatmapset).where(eq(beatmapset.id, setId)).limit(1);
	if (!set || set.deletedAt || set.id === INTRO_SET_ID || await ownerOf(set) !== userId) {
		throw new UploadRefused('Not one of your maps', 'notYours');
	}
	return set;
};

/** The player's own set a file names, for the editor to show where it stands. */
export const ownSetOfFile = async (fileSetId: number, userId: number) => {
	const set = await setOfFileId(fileSetId);
	return ownSet(set?.id ?? 0, userId);
};

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** A new map the player says they made: its Creator must be their osu! name. */
const checkCreator = async (charts: UploadChart[], userId: number) => {
	const [user] = await db.select({ username: users.username }).from(users)
		.where(eq(users.id, userId)).limit(1);
	if (!user || !sameName(charts[0].chart.metadata.creator, user.username)) {
		throw new UploadRefused('The map\'s Creator is not your osu! name', 'notCreator');
	}
};

/** Where an upload goes: the set it replaces (`setId`), or a new one, linked to osu!'s
 *  `osuSetId` when it comes from there. Read from the ids and the Creator its files
 *  carry - trusted: forging them to get a map up is the moderators' matter.
 *  - one of our sets (or an osu! set we know): replaced, when it is the player's own
 *    and neither ranked nor in the ranking queue;
 *  - an osu! set we don't know yet: new and linked, when osu! says they mapped it;
 *  - no id (or one osu! doesn't know): new, when its Creator is the player's name. */
export const uploadTarget = async (
	charts: UploadChart[],
	userId: number,
): Promise<{ setId?: number, osuSetId?: number }> => {
	const fileSetId = charts.map(({ text }) => fileIdsOf(text).setId).find(id => id !== undefined);
	const known = fileSetId === undefined ? undefined : await setOfFileId(fileSetId);
	if (known) {
		if (known.id === INTRO_SET_ID || await ownerOf(known) !== userId) {
			throw new UploadRefused('Not one of your maps', 'notYours');
		}
		if (known.deletedAt) return { setId: known.id };
		// ranked or queued in any ruleset, its files are that ruleset's to keep
		for (const [, { status }] of await statusesOf(known.id)) {
			if (isApproved(status)) {
				throw new UploadRefused(`This map is ${status}: unrank it to change it`, status);
			}
			if (status === 'pending') throw new UploadRefused('This map is in the ranking queue', 'locked');
		}
		return { setId: known.id };
	}
	if (fileSetId !== undefined && fileSetId < OWN_ID_FROM) {
		const osu = await fetchBeatmapset(fileSetId).catch(() => {
			throw new UploadRefused('osu! could not be asked who made this map: try again later', 'busy');
		});
		if (osu) {
			if (osu.user_id !== userId) throw new UploadRefused('Another mapper made this map on osu!', 'notYours');
			await checkQuota(userId);
			return { osuSetId: fileSetId };
		}
	}
	await checkCreator(charts, userId);
	await checkQuota(userId);
	return {};
};

/** What a status change clears: leaving unranked deletes the unranked leaderboard's
 *  scores, moving between ranked and loved reprices their pp, and unranking wipes
 *  all progression earned on its difficulties. */
export const clearForStatus = async (
	r: ServerRuleset,
	setId: number,
	was: BeatmapStatus,
	status: BeatmapStatus,
) => {
	if (was === 'unranked' && status !== 'unranked') await wipeUnrankedScores(setId, [r]);
	if (!isApproved(was) || status === was) return;
	const diffs = await db.select({ id: beatmaps.id })
		.from(beatmaps)
		.where(and(eq(beatmaps.setId, setId), diffsOf(r)));
	for (const diff of diffs) {
		if (isApproved(status)) await repriceBeatmapScores(diff.id, status === 'loved');
		else await purgeBeatmapScores(diff.id);
	}
};

/** The mapper unranks their own approved map: it is theirs to change or take down
 *  again, every score and progression earned on it goes, and only the team ranks it back. */
export const unrankOwn = async (r: ServerRuleset, setId: number, userId: number) => {
	const set = await ownSet(setId, userId);
	const was = (await statusIn(r, set.id))?.status ?? 'pending';
	if (!isApproved(was)) throw new UploadRefused('This map is not ranked', 'notRanked');
	await writeStatus(r, set.id, {
		status: 'unranked', rankedAt: null, reviewNote: null,
	});
	await db.update(beatmapset).set({ uploadedAt: new Date() }).where(eq(beatmapset.id, set.id));
	await clearForStatus(r, set.id, was, 'unranked');
};

/** The player's own unranked set `setId`; refused when it isn't theirs or is no longer unranked. */
export const ownUnrankedSet = async (r: ServerRuleset, setId: number, userId: number) => {
	const set = await ownSet(setId, userId);
	if ((await statusIn(r, set.id))?.status !== 'unranked') {
		throw new UploadRefused('This map is in the ranking queue', 'locked');
	}
	return set;
};

/** Put the player's unranked set in a ruleset's ranking queue: it needs a difficulty that
 *  ruleset plays, and its unranked leaderboard goes. */
export const submitForRank = async (r: ServerRuleset, setId: number, userId: number) => {
	const set = await ownUnrankedSet(r, setId, userId);
	const [played] = await db.select({ id: beatmaps.id }).from(beatmaps)
		.where(and(eq(beatmaps.setId, set.id), diffsOf(r))).limit(1);
	if (!played) throw new UploadRefused('This map has no difficulty this ruleset plays', 'no4k');
	await wipeUnrankedScores(set.id, [r]);
	await writeStatus(r, set.id, {
		status: 'pending', submittedAt: new Date(), reviewNote: null,
	});
};

/** Take the player's set back out of a ruleset's queue, before it is ranked. */
export const withdrawFromRank = async (r: ServerRuleset, setId: number, userId: number) => {
	const set = await ownSet(setId, userId);
	if ((await statusIn(r, set.id))?.status !== 'pending') {
		throw new UploadRefused('This map is not in the ranking queue', 'notQueued');
	}
	// a map the team queued is theirs to rank or send back, not its mapper's to take
	if (set.uploadedAt === null) throw new UploadRefused('Not one of your uploads', 'notYours');
	await writeStatus(r, set.id, { status: 'unranked' });
};
