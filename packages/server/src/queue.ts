import { eq } from 'drizzle-orm';
import {
	AUTOPILOT_MODE,
	AWAY_HOURS,
	nextStart,
	rotateQueue,
	SUPPORTER_AWAY_HOURS,
	applyQueueEdit,
	type QueueEdit,
	type QueueEntry,
	type QueueSource,
	type QueuePrefs,
	type QueueState,
} from '@oss-idle/shared/queue';
import { db } from './db/client';
import {
	characters,
	getCharacterById,
	type CharacterRow,
} from './db/schema/character';
import {
	users,
	type UserRow,
} from './db/schema/user';
import {
	redis,
	withLock,
} from './redis';
import { redisKeyPrefix } from './env';
import { hub } from './ws/hub';
import {
	areOnline,
	leave,
	touch,
} from './ws/presence';
import {
	abortPlay,
	isPlaying,
	playState,
	startPlay,
} from './play';
import { isSupporter } from './supporter';
import { cleanMods } from '@oss-idle/shared/mods';
import { ownMatch } from './ws/multiplayer';

/**
 * The character's play queue, chained by the server whether a game is open or
 * not (spec/queue.md §9). A play's end schedules the head at `nextAt`; the sweep
 * starts it. A head the server can't rank is offered to a connected client,
 * which plays it locally and says for how long. With no client connected
 * ("away"), those are skipped, and the character logs off once the window ends
 * or nothing is left to play.
 */

type Stored = QueueSource & {
	entries: QueueEntry[];
	paused: boolean;
	nextAt?: number;
	remaining?: number;
	/** an unranked head waiting for a client to claim it */
	offer?: { serial: number; entry: QueueEntry };
	/** a client is running a local play until then */
	localUntil?: number;
	/** SD / PF: the map that just failed, played again before the queue moves on */
	again?: QueueEntry;
	/** a client's result screen: nothing starts before then */
	holdUntil?: number;
	failures?: number;
};

const EMPTY: Stored = {
	label: '', entries: [], paused: false,
};

const queueKey = (id: number) => `${redisKeyPrefix}queue:${id}`;
const lockKey = (id: number) => `${redisKeyPrefix}queue:lock:${id}`;
/** character -> nextAt */
const DUE = `${redisKeyPrefix}queue:due`;
/** character -> when its window ends */
const AWAY = `${redisKeyPrefix}away`;

/** Long enough for a client to load a map and say it started. */
const OFFER_MS = 15_000;
const CLAIM_MS = 60_000;
const RETRY_MS = 2000;
const MAX_FAILURES = 3;

const read = async (id: number): Promise<Stored> => {
	const raw = await redis.get(queueKey(id));
	return raw ? JSON.parse(raw) as Stored : { ...EMPTY };
};

const prefsOf = (row: CharacterRow, user: UserRow): QueuePrefs => ({
	mode: row.autopilotMode,
	delay: row.autopilotDelay,
	rate: row.playRate,
	mods: row.playMods ?? [],
	keepPlaying: user.keepPlaying,
});

const userOf = async (row: CharacterRow): Promise<UserRow | undefined> =>
	(await db.select().from(users).where(eq(users.id, row.userId)).limit(1))[0];

const disabled = (row: CharacterRow) => row.autopilotMode === AUTOPILOT_MODE.DISABLED;

const toDTO = (s: Stored, row: CharacterRow, user: UserRow): QueueState => ({
	label: s.label,
	mode: s.mode,
	groupKey: s.groupKey,
	entries: s.entries,
	paused: s.paused || disabled(row),
	nextAt: s.nextAt,
	remaining: s.remaining,
	prefs: prefsOf(row, user),
	serverNow: Date.now(),
});

export const queueState = async (id: number): Promise<QueueState | undefined> => {
	const row = await getCharacterById(id);
	const user = row && await userOf(row);
	return user && toDTO(await read(id), row, user);
};

const push = async (id: number): Promise<void> => {
	const state = await queueState(id);
	if (state) {
		hub.sendTo(id, {
			type: 'queue:state', state,
		});
	}
};

const save = async (id: number, s: Stored): Promise<void> => {
	const tx = redis.multi().set(queueKey(id), JSON.stringify(s));
	if (s.nextAt === undefined) tx.zrem(DUE, String(id));
	else tx.zadd(DUE, s.nextAt, String(id));
	await tx.exec();
};

/** Change the queue under its lock, then show every device. */
const change = async (id: number, fn: (s: Stored) => void): Promise<Stored> => {
	const s = await withLock(lockKey(id), async () => {
		const s = await read(id);
		fn(s);
		await save(id, s);
		return s;
	});
	await push(id);
	return s;
};

const delayMs = (row: CharacterRow) => row.autopilotDelay * 1000;

/** Schedule the head, unless something holds the queue. */
const schedule = (s: Stored, row: CharacterRow, ms: number): void => {
	const at = nextStart(s, row.autopilotMode, Date.now(), ms);
	s.nextAt = at === undefined ? undefined : Math.max(at, s.holdUntil ?? 0);
};

const rotate = (s: Stored, played: QueueEntry): void => {
	s.entries = rotateQueue(s.entries, played);
};

// --- client edits ---------------------------------------------------------

const emptied = (s: Stored): void => {
	if (s.entries.length) return;
	s.nextAt = undefined;
	s.remaining = undefined;
};

export const setEntries = (
	id: number, source: QueueSource, entries: QueueEntry[],
) => change(id, s => {
	s.label = source.label;
	s.mode = source.mode;
	s.groupKey = source.groupKey;
	s.entries = entries;
	// built as a map launches: the launched play's end is what schedules
	s.nextAt = undefined;
	s.remaining = undefined;
});

export const editQueue = (id: number, edit: QueueEdit) => change(id, s => {
	// adding to nothing starts a new queue
	if ((edit.op === 'append' || edit.op === 'playNext') && !s.entries.length) {
		s.label = edit.label ?? '';
		s.mode = undefined;
		s.groupKey = undefined;
	}
	s.entries = applyQueueEdit(s.entries, edit);
	emptied(s);
});

const busy = async (id: number, s: Stored) =>
	await isPlaying(id) || (s.localUntil ?? 0) > Date.now();

export const pauseQueue = async (id: number, paused: boolean): Promise<void> => {
	const row = await getCharacterById(id);
	if (!row) return;
	const running = await busy(id, await read(id));
	await change(id, s => {
		if (paused) {
			s.remaining = s.nextAt === undefined ? s.remaining : Math.max(0, s.nextAt - Date.now());
			s.paused = true;
			s.nextAt = undefined;
			return;
		}
		if (disabled(row)) return;
		s.paused = false;
		// a running play's end schedules the next one
		if (!running && s.nextAt === undefined) schedule(s, row, s.remaining ?? delayMs(row));
		s.remaining = undefined;
	});
};

export const startQueue = async (id: number): Promise<void> => {
	const row = await getCharacterById(id);
	if (!row || disabled(row)) return;
	await change(id, s => {
		s.paused = false;
		s.remaining = undefined;
		s.holdUntil = undefined;
		schedule(s, row, 0);
	});
};

/** Drop the running play and start the head now. */
export const skipQueue = async (id: number): Promise<void> => {
	const state = await playState(id);
	// the abort schedules the next one with the delay; this brings it forward
	if (state.phase === 'active') await abortPlay(id, state.token);
	const row = await getCharacterById(id);
	if (!row) return;
	await change(id, s => {
		s.localUntil = undefined;
		s.holdUntil = undefined;
		schedule(s, row, 0);
	});
};

export const setPrefs = async (id: number, prefs: Partial<QueuePrefs>): Promise<void> => {
	const row = await getCharacterById(id);
	if (!row) return;
	const own = {
		autopilotMode: prefs.mode,
		autopilotDelay: prefs.delay,
		playRate: prefs.rate,
		playMods: prefs.mods && cleanMods(prefs.mods),
	};
	if (Object.values(own).some(v => v !== undefined)) {
		await db.update(characters).set(own).where(eq(characters.id, id));
	}
	if (prefs.keepPlaying !== undefined) {
		await db.update(users).set({ keepPlaying: prefs.keepPlaying }).where(eq(users.id, row.userId));
	}
	if (prefs.mode === AUTOPILOT_MODE.DISABLED) {
		await pauseQueue(id, true);
		return;
	}
	await push(id);
};

export const claimOffer = async (id: number, serial: number): Promise<boolean> => {
	let ok = false;
	await change(id, s => {
		if (s.offer?.serial !== serial) return;
		ok = true;
		rotate(s, s.offer.entry);
		s.offer = undefined;
		s.failures = 0;
		// if the client never says it started, carry on without it
		s.localUntil = Date.now() + CLAIM_MS;
		s.nextAt = s.localUntil;
	});
	return ok;
};

export const localStart = async (id: number, ms: number): Promise<void> => {
	const row = await getCharacterById(id);
	if (!row) return;
	await change(id, s => {
		s.localUntil = Date.now() + ms;
		schedule(s, row, ms + delayMs(row));
	});
};

/** The result screen just opened: the countdown starts over from now, and is
 *  never cut shorter than it already was. */
export const holdQueue = (id: number, ms: number) => change(id, s => {
	s.holdUntil = Date.now() + ms;
	if (s.nextAt !== undefined) s.nextAt = Math.max(s.nextAt, s.holdUntil);
});

export const localEnd = async (id: number, skip: boolean): Promise<void> => {
	const row = await getCharacterById(id);
	if (!row) return;
	await change(id, s => {
		s.localUntil = undefined;
		if (skip) s.holdUntil = undefined;
		schedule(s, row, skip ? 0 : delayMs(row));
	});
};

// --- the chain ------------------------------------------------------------

/** A ranked play just ended (finalised or aborted): the next one follows, or
 *  `again` (an SD / PF fail) right away. */
export const playEnded = async (id: number, again?: QueueEntry): Promise<void> => {
	// a match round ends into the match, not into the queue
	if (await ownMatch(id)) return;
	const row = await getCharacterById(id);
	if (!row) return;
	const held = await read(id);
	if (again && !held.paused && !disabled(row)) {
		await change(id, s => {
			s.again = again;
			s.nextAt = Date.now();
		});
		return;
	}
	// a character that never had a queue has nothing to chain, nor to be told
	if (!await redis.exists(queueKey(id))) return;
	const s = await change(id, s => schedule(s, row, delayMs(row)));
	if (s.nextAt === undefined && await isAway(id)) await logOff(id);
};

const stop = async (id: number, reason: 'failed' | 'restricted' | 'inMatch'): Promise<void> => {
	await change(id, s => {
		s.paused = true;
		s.nextAt = undefined;
		s.failures = 0;
	});
	hub.sendTo(id, {
		type: 'queue:stopped', reason,
	});
};

const offer = async (id: number, entry: QueueEntry): Promise<void> => {
	const serial = Date.now();
	await change(id, s => {
		s.offer = {
			serial, entry,
		};
		s.nextAt = serial + OFFER_MS;
	});
	hub.sendTo(id, {
		type: 'queue:offer', serial, entry,
	});
};

/** A start that did not happen tries again shortly; three in a row pause the queue. */
const startFailed = async (id: number): Promise<void> => {
	const s = await change(id, s => {
		s.failures = (s.failures ?? 0) + 1;
		s.nextAt = Date.now() + RETRY_MS;
	});
	if ((s.failures ?? 0) >= MAX_FAILURES) await stop(id, 'failed');
};

/** What happened trying to start the head. `next` means try the one after it now. */
const tryHead = async (
	id: number, row: CharacterRow, head: QueueEntry, away: boolean,
): Promise<'done' | 'next'> => {
	// a seated player's only play is the round's
	if (await ownMatch(id)) {
		await stop(id, 'inMatch');
		return 'done';
	}
	const result = await startPlay(row, head.beatmapId, {
		rate: head.rate ?? row.playRate, mods: row.playMods ?? [],
	});
	switch (result.status) {
		case 'ranked':
			if (!result.joined) {
				await change(id, s => {
					rotate(s, head);
					s.failures = 0;
				});
			}
			return 'done';
		case 'unranked':
			if (!away) {
				await offer(id, head);
				return 'done';
			}
			await change(id, s => rotate(s, head));
			return 'next';
		case 'refused':
			await startFailed(id);
			return 'done';
		case 'restricted':
			hub.sendTo(id, {
				type: 'queue:stopped', reason: 'restricted',
			});
			await logOff(id);
			return 'done';
	}
};

/** Play a failed SD / PF map again. */
const retry = async (id: number, row: CharacterRow, again: QueueEntry): Promise<boolean> => {
	await change(id, s => void (s.again = undefined));
	// a round's fail is the match's business
	if (await ownMatch(id)) return true;
	const result = await startPlay(row, again.beatmapId, {
		rate: again.rate ?? row.playRate, mods: row.playMods ?? [],
	});
	return result.status === 'ranked';
};

/** Nobody took the unranked head: play on without it. */
const dropOffer = async (id: number, s: Stored): Promise<Stored> => {
	if (!s.offer) return s;
	const skipped = s.offer.entry;
	return change(id, s => {
		rotate(s, skipped);
		s.offer = undefined;
	});
};

/** Walk the queue from its head until something starts. With the game closed,
 *  what can't start here is skipped, and nothing left to play logs off. */
const startFromHead = async (id: number, row: CharacterRow, away: boolean): Promise<void> => {
	let s = await read(id);
	const tries = s.entries.length;
	for (let i = 0; i < tries; i++) {
		const head = s.entries[0];
		if (!head || s.paused || disabled(row)) break;
		if (await tryHead(id, row, head, away) === 'done') return;
		s = await read(id);
	}
	if (away) await logOff(id);
};

/** Start the head of the queue (or the SD / PF retry before it). */
const runNext = async (id: number): Promise<void> => {
	const row = await getCharacterById(id);
	if (!row) return;
	const away = await isAway(id);
	// nobody connected and no closed-game window: there is no one to play for
	if (!away && !(await areOnline([id]))[0]) {
		await halt(id);
		return;
	}
	const s = await dropOffer(id, await read(id));
	if (await busy(id, s)) {
		// a client already started the retry itself
		if (s.again) await change(id, s => void (s.again = undefined));
		return;
	}
	const retrying = s.again && !s.paused && !disabled(row);
	if (retrying && await retry(id, row, s.again!)) return;
	await startFromHead(id, row, away);
};

/** One sweep at a time per worker: a start simulates a whole map, and a sweep
 *  firing again meanwhile would pile more of them onto the same event loop. */
let sweeping = false;

/** Start every queue whose head is due. Safe on every worker: the ZREM claims. */
export const sweepQueues = async (): Promise<void> => {
	if (sweeping) return;
	sweeping = true;
	try {
		const due = await redis.zrangebyscore(DUE, '-inf', Date.now());
		for (const id of due) {
			if (await redis.zrem(DUE, id) !== 1) continue;
			await runDue(Number(id));
		}
	} finally {
		sweeping = false;
	}
};

const runDue = async (id: number): Promise<void> => {
	try {
		await change(id, s => {
			s.nextAt = undefined;
		});
		await runNext(id);
	} catch (e) {
		console.error('[queue] next failed for', id, e);
		await startFailed(id).catch(() => undefined);
	}
};

// --- away -----------------------------------------------------------------

export const isAway = async (id: number): Promise<boolean> =>
	await redis.zscore(AWAY, String(id)) !== null;

/** Whether the character would play on with its game closed: the option on,
 *  something queued, nothing holding it. */
const playsOn = async (id: number): Promise<UserRow | undefined> => {
	const row = await getCharacterById(id);
	const user = row && await userOf(row);
	if (!row || !user?.keepPlaying || user.restrictedAt) return undefined;
	const s = await read(id);
	return s.paused || disabled(row) || !s.entries.length ? undefined : user;
};

export const goAway = async (id: number): Promise<boolean> => {
	const user = await playsOn(id);
	if (!user) return false;
	const s = await read(id);
	const hours = await isSupporter(user.id) ? SUPPORTER_AWAY_HOURS : AWAY_HOURS;
	await redis.zadd(AWAY, Date.now() + hours * 3600_000, String(id));
	// the local play the closed client was running died with it
	if (s.offer || s.localUntil !== undefined) {
		await change(id, s => {
			s.localUntil = undefined;
			s.nextAt = Date.now();
		});
	}
	return true;
};

/**
 * A socket closed. That alone says nothing about the game being closed: a
 * reconnect follows a deploy or a dropped connection within seconds, and another
 * tab may hold a socket on another worker. So a character that would play on
 * stays as it is, and the presence sweep decides, once no client has been heard
 * from for its TTL. Anyone else goes offline now, as before.
 */
export const socketClosed = async (id: number): Promise<void> => {
	const s = await read(id).catch(() => undefined);
	// a queue that would run: the presence sweep decides, either way
	if (s && !s.paused && s.entries.length) return;
	await leave(id);
};

/** Nothing more starts: the queue stays as it is, with nothing scheduled. */
const halt = (id: number) => change(id, s => {
	s.nextAt = undefined;
	s.offer = undefined;
	s.again = undefined;
	s.localUntil = undefined;
});

/** No client of the character has been heard from: it keeps playing with the
 *  game closed, or goes offline. */
export const leaveOrPlayOn = async (id: number): Promise<void> => {
	const playing = await goAway(id).catch(e => {
		console.error('[queue] away failed for', id, e);
		return false;
	});
	if (playing) return;
	if (await redis.exists(queueKey(id))) await halt(id);
	await leave(id);
};

/** A client is connected again. */
export const comeBack = (id: number): Promise<number> => redis.zrem(AWAY, String(id));

/** The character stops playing for good: the queue is cleared. */
export const logOff = async (id: number): Promise<void> => {
	// under the queue's lock, or a change in flight would write it back
	await withLock(lockKey(id), () => redis.multi()
		.zrem(AWAY, String(id))
		.zrem(DUE, String(id))
		.del(queueKey(id))
		.exec());
	if (!hub.isLocal(id)) await leave(id);
};

/** Keep away characters on the roster, and log off those whose window ended. */
export const sweepAway = async (): Promise<void> => {
	const now = Date.now();
	for (const id of await redis.zrangebyscore(AWAY, '-inf', now)) {
		if (await redis.zrem(AWAY, id) === 1) await logOff(Number(id));
	}
	for (const id of await redis.zrangebyscore(AWAY, now, '+inf')) await touch(Number(id));
};

/** A rebirth moves the account onto a new character: its queue follows, and the
 *  end of the play that rebirthed schedules it. */
export const rekeyQueue = async (fromId: number, toId: number): Promise<void> => {
	const s = await read(fromId);
	const deadline = await redis.zscore(AWAY, String(fromId));
	const tx = redis.multi()
		.del(queueKey(fromId))
		.zrem(DUE, String(fromId))
		.zrem(AWAY, String(fromId))
		.set(queueKey(toId), JSON.stringify({
			...s, nextAt: undefined, offer: undefined, localUntil: undefined,
		}));
	if (deadline !== null) tx.zadd(AWAY, deadline, String(toId));
	await tx.exec();
};
