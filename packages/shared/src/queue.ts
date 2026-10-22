import { z } from 'zod';
import {
	mapped,
	type ValueIn,
} from './helpers/mapped.js';
import { rateSchema } from './rate.js';
import { modsSchema } from './mods.js';

/**
 * The play queue lives on the server, one per character, and the server chains
 * it - game open or not. Every client is a view of it: an edit replaces the
 * whole list (last write wins) and the server pushes `queue:state` to every one
 * of the character's sockets.
 */

/** How song select builds the queue. `DISABLED` builds none and keeps it paused. */
export const AutopilotModes = [
	'DISABLED',
	'PLAYLIST',
	'NEXT',
	'SHUFFLE',
	'LOOP',
] as const;
export const AUTOPILOT_MODE = mapped(AutopilotModes);
export type AutopilotMode = ValueIn<typeof AUTOPILOT_MODE>;

export const AUTOPILOT_DELAY = {
	min: 3, max: 120, default: 30,
} as const;

export const MAX_QUEUE = 5000;

/** Hours a character keeps playing once its game is closed. */
export const AWAY_HOURS = 12;
export const SUPPORTER_AWAY_HOURS = 24;

export const queueEntryDTO = z.object({
	beatmapId: z.number().int(),
	/** a playlist's locked rate; otherwise the character's own rate */
	rate: rateSchema.optional(),
});
export type QueueEntry = z.infer<typeof queueEntryDTO>;

export const queuePrefsDTO = z.object({
	mode: z.enum(AutopilotModes),
	delay: z.number().int().min(AUTOPILOT_DELAY.min).max(AUTOPILOT_DELAY.max),
	rate: rateSchema,
	mods: modsSchema,
	/** the account's: the character plays on once the game is closed */
	keepPlaying: z.boolean(),
});
export type QueuePrefs = z.infer<typeof queuePrefsDTO>;

/** Where the queue came from, for display and to reopen its song select group. */
export const queueSourceDTO = z.object({
	label: z.string().max(200),
	/** unset when the queue was started by adding a map to it */
	mode: z.enum(AutopilotModes).optional(),
	groupKey: z.string().max(200).optional(),
});
export type QueueSource = z.infer<typeof queueSourceDTO>;

/** Edits name entries rather than positions: a device shows only the maps it
 *  knows, and must not drop the ones it doesn't. */
export const queueEditDTO = z.discriminatedUnion('op', [
	z.object({
		op: z.literal('append'), entry: queueEntryDTO, label: z.string().max(200).optional(),
	}),
	z.object({
		op: z.literal('playNext'), entry: queueEntryDTO, label: z.string().max(200).optional(),
	}),
	z.object({
		op: z.literal('remove'), entry: queueEntryDTO,
	}),
	// `before` unset: to the back
	z.object({
		op: z.literal('move'), entry: queueEntryDTO, before: queueEntryDTO.optional(),
	}),
	z.object({ op: z.literal('clear') }),
]);
export type QueueEdit = z.infer<typeof queueEditDTO>;

export const queueStateDTO = queueSourceDTO.extend({
	entries: z.array(queueEntryDTO).max(MAX_QUEUE),
	paused: z.boolean(),
	/** server clock: when the next map starts, while one is scheduled */
	nextAt: z.number().optional(),
	/** ms left of the countdown when it was paused */
	remaining: z.number().optional(),
	prefs: queuePrefsDTO,
	serverNow: z.number(),
});
export type QueueState = z.infer<typeof queueStateDTO>;

export const queueClientMessages = [
	// a fresh queue, built from song select
	z.object({
		type: z.literal('queue:set'),
		source: queueSourceDTO,
		entries: z.array(queueEntryDTO).max(MAX_QUEUE),
	}),
	z.object({
		type: z.literal('queue:edit'),
		edit: queueEditDTO,
	}),
	z.object({
		type: z.literal('queue:pause'),
		paused: z.boolean(),
	}),
	// unpause and start the head now
	z.object({ type: z.literal('queue:start') }),
	// drop the running play and start the head now
	z.object({ type: z.literal('queue:skip') }),
	z.object({
		type: z.literal('queue:prefs'),
		prefs: queuePrefsDTO.partial(),
	}),
	// take the unranked head the server offered: this client plays it locally
	z.object({
		type: z.literal('queue:claim'),
		serial: z.number().int(),
	}),
	// this client runs a local play for `ms`; the queue waits for it
	z.object({
		type: z.literal('queue:localStart'),
		ms: z.number().int().min(0).max(24 * 3600_000),
	}),
	// the result screen is up: the next map waits `ms` from now
	z.object({
		type: z.literal('queue:hold'),
		ms: z.number().int().min(0).max(5 * 60_000),
	}),
	// the local play ended early (abort / skip)
	z.object({
		type: z.literal('queue:localEnd'),
		skip: z.boolean().optional(),
	}),
] as const;

export const queueServerMessages = [
	z.object({
		type: z.literal('queue:state'),
		state: queueStateDTO,
	}),
	// the head is not ranked: a connected client has to play it locally
	z.object({
		type: z.literal('queue:offer'),
		serial: z.number().int(),
		entry: queueEntryDTO,
	}),
	z.object({
		type: z.literal('queue:claim'),
		serial: z.number().int(),
		ok: z.boolean(),
	}),
	// the server paused the queue on its own
	z.object({
		type: z.literal('queue:stopped'),
		reason: z.enum(['failed', 'restricted', 'inMatch']),
	}),
] as const;

export const sameEntry = (a: QueueEntry, b: QueueEntry) =>
	a.beatmapId === b.beatmapId && a.rate === b.rate;

/** The map that just started goes to the back. Named rather than assumed to be
 *  the head: the queue may have been edited while it started. */
export const rotateQueue = (entries: QueueEntry[], played: QueueEntry): QueueEntry[] => {
	const at = entries.findIndex(e => sameEntry(e, played));
	if (at < 0) return entries;
	return [...entries.slice(0, at), ...entries.slice(at + 1), entries[at]];
};

/** When the head starts, `ms` from now - or never, while something holds the queue. */
export const nextStart = (
	q: { paused: boolean; entries: unknown[] }, mode: AutopilotMode, now: number, ms: number,
): number | undefined =>
	q.paused || mode === AUTOPILOT_MODE.DISABLED || !q.entries.length ? undefined : now + ms;

const without = (entries: QueueEntry[], entry: QueueEntry): QueueEntry[] => {
	const at = entries.findIndex(e => sameEntry(e, entry));
	return at < 0 ? entries : [...entries.slice(0, at), ...entries.slice(at + 1)];
};

export const applyQueueEdit = (entries: QueueEntry[], edit: QueueEdit): QueueEntry[] => {
	switch (edit.op) {
		case 'append':
			return [...entries, edit.entry].slice(0, MAX_QUEUE);
		case 'playNext':
			return [edit.entry, ...entries.filter(e => !sameEntry(e, edit.entry))].slice(0, MAX_QUEUE);
		case 'remove':
			return without(entries, edit.entry);
		case 'move': {
			if (!entries.some(e => sameEntry(e, edit.entry))) return entries;
			const rest = without(entries, edit.entry);
			const at = edit.before ? rest.findIndex(e => sameEntry(e, edit.before!)) : -1;
			return at < 0 ? [...rest, edit.entry] : [...rest.slice(0, at), edit.entry, ...rest.slice(at)];
		}
		case 'clear':
			return [];
	}
};
