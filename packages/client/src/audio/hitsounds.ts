import { effects } from './EffectPlayer';
import { audioContext } from './audioContext';
import {
	type HitSoundName,
	renderHitsound,
	type SampleSetName,
} from './hitsoundSynth';
import BeatmapStore from '../osu/beatmap/beatmap_store';
import {
	assetKey,
	type SampleEvent,
} from '../osu/beatmap/storyboard';
import {
	mapSampleName,
	type NoteSound,
} from '@oss-idle/shared/sim/noteSounds';
import {
	currentSkin,
	HITSOUND,
	type Hitsound,
	Hitsounds,
} from '../osu/skin/Skin';

/**
 * Hitsounds. A note's sounds (see shared noteSounds: additions, sample sets, custom
 * indices, volumes, its own sample files) are resolved here to samples: the map's
 * file when it has one, else the skin's, else our own synthesised default
 * (hitsoundSynth). Storyboard samples go through SampleSchedule.
 */

const hitsoundKey = (sound: Hitsound) => currentSkin.get().data.hitSounds[sound];

/** Decode the current skin's hitsounds, keyed by URL so a skin change never reuses
 *  the previous skin's buffers. */
async function preloadHitsounds(): Promise<void> {
	await Promise.all(Hitsounds.map(sound => effects.load(hitsoundKey(sound), hitsoundKey(sound))));
}

void currentSkin.sync(preloadHitsounds);
// mobile browsers kill a hidden tab's fetches: load what they cut when it comes back
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible') void preloadHitsounds();
});

/**
 * Decode a set's sample blobs (keysounds / storyboard samples) into the effects
 * player, keyed by their stable asset key, so they can be scheduled with no
 * latency. De-duplicated by key; already-loaded and missing files are skipped.
 */
export async function preloadSamples(
	setId: number, 
	events: SampleEvent[],
): Promise<void> {
	const unique = new Map<string, string>();
	for (const ev of events) if (!unique.has(ev.key)) unique.set(ev.key, ev.file);
	await Promise.all([...unique].map(async ([key, file]) => {
		if (effects.isLoaded(key)) return;
		const url = await BeatmapStore.getSampleUrl(setId, file);
		if (url) await effects.load(key, url);
	}));
}

const synthMade = new Map<string, Promise<void>>();

/** One of our default hitsounds, made once into the effects player as `synth:<set>-<sound>`,
 *  each in a task of its own: a map's first play never freezes the page making them. */
const storeSynth = (set: SampleSetName, sound: HitSoundName): Promise<void> => {
	const key = `synth:${set}-${sound}`;
	let made = synthMade.get(key);
	if (!made) {
		made = new Promise<void>(resolve => setTimeout(() => {
			const data = renderHitsound(set, sound, audioContext.sampleRate);
			const buffer = audioContext.createBuffer(1, data.length, audioContext.sampleRate);
			buffer.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
			effects.store(key, buffer);
			resolve();
		}));
		synthMade.set(key, made);
	}
	return made;
};

/** The skin's sample for a hitsound, when the skin has one (today: normal-hitnormal). */
const skinKey = (name: string): string | undefined =>
	name === 'normal-hitnormal' ? hitsoundKey(HITSOUND.NORMAL) : undefined;

/** Where a sound plays from: its effects key, and whether it is the map's own file
 *  (pitched with the song at other rates, like keysounds). */
export type ResolvedSound = { key: string, mapFile: boolean };
export type SoundResolver = (sound: NoteSound) => ResolvedSound | undefined;

const soundId = (sound: NoteSound) =>
	('file' in sound ? `file:${sound.file}` : `${sound.set}-${sound.sound}:${sound.index}`);

/** Load the map file `name` (any of its extensions) into the effects player. */
const mapFile = async (setId: number, name: string): Promise<string | undefined> => {
	const key = assetKey(setId, name);
	if (effects.isLoaded(key)) return key;
	const url = await BeatmapStore.getSampleUrl(setId, name);
	if (!url) return undefined;
	try {
		return (await effects.load(key, url)) ? key : undefined;
	} finally {
		// a new blob URL at every ask: read once, let go
		URL.revokeObjectURL(url);
	}
};

/**
 * Get every sound of these notes ready to play - the map's files loaded, our defaults
 * made - and return what each sound plays from. A map file that is missing stays silent.
 */
export async function prepareNoteSounds(
	setId: number,
	notes: { sounds: NoteSound[] }[],
): Promise<SoundResolver> {
	const unique = new Map<string, NoteSound>();
	for (const note of notes) for (const sound of note.sounds) unique.set(soundId(sound), sound);
	const resolved = new Map<string, ResolvedSound>();
	await Promise.all([...unique].map(async ([id, sound]) => {
		if ('file' in sound) {
			const key = await mapFile(setId, sound.file);
			if (key) resolved.set(id, {
				key, mapFile: true, 
			});
			return;
		}
		const own = mapSampleName(sound);
		const key = own && await mapFile(setId, own);
		const name = `${sound.set}-${sound.sound}`;
		const skin = !key && skinKey(name);
		if (!key && !skin) await storeSynth(sound.set, sound.sound);
		resolved.set(id, key ? {
			key, mapFile: true, 
		} : {
			key: skin || `synth:${name}`, mapFile: false, 
		});
	}));
	return sound => resolved.get(soundId(sound));
}

/** Play the hitsound(s) for a landed hit, now. */
export function playHitsound(): void {
	effects.play(hitsoundKey(HITSOUND.NORMAL));
}

/**
 * Schedule the hitsound(s) for a hit at song time `songMs`, given the song's
 * current playback position `nowMs`. The lead (`songMs - nowMs`) is laid onto
 * the audio clock so it fires sample-accurately even if the JS loop is throttled
 * (e.g. a backgrounded tab). Hits already in the past (`songMs < nowMs`) are
 * dropped rather than played late.
 */
export function scheduleHitsound(songMs: number, nowMs: number): void {
	if (songMs < nowMs) return;
	effects.play(hitsoundKey(HITSOUND.NORMAL), { atMs: effects.now() + (songMs - nowMs) });
}

/** Drop every hitsound already queued on the audio clock. Called when a play ends
 *  early on fail so look-ahead-scheduled hits don't keep firing past the fail. */
export function stopScheduledHitsounds(): void {
	effects.stopAll();
}
