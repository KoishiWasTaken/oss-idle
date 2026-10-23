import {
	strFromU8,
	strToU8,
	zipSync,
	type Unzipped,
} from 'fflate';
import { extrasFile } from '@oss-idle/shared/editor/extras';
import type LightBeatmap from '../osu/beatmap/LightBeatmap';
import LightBeatmapSet from '../osu/beatmap/LightBeatmapSet';
import BeatmapStore, {
	type RuntimeMetadata,
	type RuntimeVersionMetadata,
	type SetRecord,
} from '../osu/beatmap/beatmap_store';
import {
	importFiles,
	localSetId,
} from '../osu/beatmap/oszImport';
import {
	fileIdsOf,
	parseChart,
	withBackground,
	withFileIds,
	withSetMetadata,
	type Metadata,
} from '@oss-idle/shared/editor/chart';
import { newChart } from './newChart';

let writing: Promise<unknown> = Promise.resolve();

/** One write to the store at a time: each reads the set only once the last has landed, so a
 *  slower one never puts back what a quicker one changed. */
const serially = <T>(write: () => Promise<T>): Promise<T> => {
	const done = writing.then(write, write);
	writing = done.catch(() => undefined);
	return done;
};

const fileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '');

/** A difficulty's .osu name, or the one osu! would give it when the store lost it. */
const chartFile = (set: RuntimeMetadata, version: RuntimeVersionMetadata): string =>
	version.file ?? fileName(`${set.artist} - ${set.title} (${set.creator}) [${version.version}].osu`);

/** A stored set as an archive. With an edit, its chart stands in for the difficulty's
 *  own, and the other difficulties take on its set-wide metadata. */
const setArchive = async (
	beatmap: LightBeatmap,
	edit?: { text: string, metadata: Metadata, extras?: string },
): Promise<{ files: Unzipped, file: string }> => {
	const record = await BeatmapStore.getSet(beatmap.set.metadata.id);
	if (!record) throw new Error(`set ${beatmap.set.metadata.id} is not stored`);
	const files = await BeatmapStore.getFiles(record.setId);
	let file = '';
	for (const version of record.metadata.versions) {
		const name = chartFile(record.metadata, version);
		const own = version.id === beatmap.metadata.id;
		if (own) file = name;
		const text = record.osu[version.id];
		files[name] = strToU8(!edit ? text : own ? edit.text : withSetMetadata(text, edit.metadata));
		if (!edit || !own) continue;
		if (edit.extras) files[extrasFile(name)] = strToU8(edit.extras);
		else delete files[extrasFile(name)];
	}
	return {
		files, file, 
	};
};

/**
 * Store an edited chart. Edits always land in a local set: a local one is
 * replaced in place under the same id (so a new title keeps its scores), a server
 * one gets its local copy. Returns the difficulty as it is now stored.
 */
// ponytail: re-imports the whole set (audio included) on every save; store only the chart if saves get slow
export const saveChart = (
	beatmap: LightBeatmap,
	text: string,
	metadata: Metadata,
	/** the .oss file's text, when there is one */
	extras?: string,
): Promise<LightBeatmap> => serially(async () => {
	const { files, file } = await setArchive(beatmap, {
		text, metadata, extras,
	});
	return storedAs(await storeLocal(beatmap, files), file);
});

/** `files` stored as the local set of `beatmap`'s: in its place when it is local,
 *  as its local copy when it is a server one. */
const storeLocal = (beatmap: LightBeatmap, files: Unzipped): Promise<SetRecord> => {
	const setId = beatmap.set.metadata.id;
	return importFiles(files, setId < 0 ? setId : undefined);
};

/** The local copy a server map's earlier edits went into, at the same difficulty: opening the
 *  server map again carries on there, rather than starting over from the server's files. */
export const localCopyOf = async (beatmap: LightBeatmap): Promise<LightBeatmap | undefined> => {
	const setId = beatmap.set.metadata.id;
	if (setId < 0) return undefined;
	const record = await BeatmapStore.getSet(setId);
	const version = record?.metadata.versions.find(v => v.id === beatmap.metadata.id);
	const text = record?.osu[beatmap.metadata.id];
	if (!record || !version || text === undefined) return undefined;
	const { artist, title, creator } = parseChart(text).metadata;
	const copy = await BeatmapStore.getSet(localSetId({
		setId: fileIdsOf(text).setId, artist, title, creator,
	}));
	const file = chartFile(record.metadata, version);
	return copy && LightBeatmapSet.fromMetadata(copy.metadata).beatmaps
		.find(other => other.metadata.runtime && other.metadata.file === file);
};

/** The difficulty stored from the .osu named `file`. */
const storedAs = (set: SetRecord, file: string): LightBeatmap => {
	const stored = LightBeatmapSet.fromMetadata(set.metadata).beatmaps
		.find(b => b.metadata.runtime && b.metadata.file === file);
	if (!stored) throw new Error(`set ${set.setId} lost ${file}`);
	return stored;
};

/** A .osu name for the difficulty that no file of the set already has. */
const freeChartFile = (files: Unzipped, metadata: Metadata): string => {
	const { artist, title, creator, version } = metadata;
	const taken = new Set(Object.keys(files).map(name => name.toLowerCase()));
	const name = (n: number) =>
		fileName(`${artist} - ${title} (${creator}) [${version}]${n > 1 ? ` ${n}` : ''}.osu`);
	let n = 1;
	while (taken.has(name(n).toLowerCase())) n++;
	return name(n);
};

/** A new local set on an audio file: one empty difficulty, named after the file. */
export const createSet = (
	audio: File,
	chart: { creator: string, version: string, keys: number },
): Promise<LightBeatmap> => serially(async () => {
	const name = fileName(audio.name);
	const text = newChart({
		...chart, audio: name, title: name.replace(/\.[^.]+$/, ''),
	});
	const files: Unzipped = { [name]: new Uint8Array(await audio.arrayBuffer()) };
	const file = freeChartFile(files, parseChart(text).metadata);
	files[file] = strToU8(text);
	// its own id: a second map on the same song is a set of its own
	const set = await importFiles(files, -(Math.floor(Math.random() * 0x7fffffff) || 1));
	return storedAs(set, file);
});

/** Add `text` to the set as a difficulty of its own, with its .oss file's text if any. */
export const addDifficulty = (
	beatmap: LightBeatmap,
	text: string,
	extras?: string,
): Promise<LightBeatmap> => serially(async () => {
	const { files } = await setArchive(beatmap);
	const file = freeChartFile(files, parseChart(text).metadata);
	files[file] = strToU8(text);
	if (extras) files[extrasFile(file)] = strToU8(extras);
	return storedAs(await storeLocal(beatmap, files), file);
});

/** The ids the server gave an upload, by .osu name, written into the stored set's
 *  files; returns the difficulty as it is now stored. */
export const writeIds = (
	beatmap: LightBeatmap,
	ids: { setId: number, beatmaps: Record<string, number> },
): Promise<LightBeatmap> => serially(async () => {
	const { files, file } = await setArchive(beatmap);
	for (const [name, beatmapId] of Object.entries(ids.beatmaps)) {
		if (!files[name]) continue;
		files[name] = strToU8(withFileIds(strFromU8(files[name]), {
			setId: ids.setId, beatmapId,
		}));
	}
	return storedAs(await storeLocal(beatmap, files), file);
});

/** Sample files added to the set (named as they are, made safe); returns the difficulty
 *  as it is now stored. */
export const addSampleFiles = (
	beatmap: LightBeatmap,
	added: File[],
): Promise<LightBeatmap> => serially(async () => {
	const { files, file } = await setArchive(beatmap);
	for (const sample of added) {
		files[fileName(sample.name)] = new Uint8Array(await sample.arrayBuffer());
	}
	return storedAs(await storeLocal(beatmap, files), file);
});

/** The set's files as stored, by their path in it (the .osu files as last saved). */
export const setFiles = async (beatmap: LightBeatmap): Promise<Unzipped> =>
	(await setArchive(beatmap)).files;

/** `changed` files written into the set (undefined deletes one), its charts left alone. */
export const changeSetFiles = (
	beatmap: LightBeatmap,
	changed: Record<string, Uint8Array | undefined>,
): Promise<LightBeatmap> => serially(async () => {
	const { files, file } = await setArchive(beatmap);
	for (const [name, data] of Object.entries(changed)) {
		if (/\.(osu|oss)$/i.test(name)) continue;
		if (data) files[name] = new Uint8Array(data);
		else delete files[name];
	}
	return storedAs(await storeLocal(beatmap, files), file);
});

/** The set without its file `name`. */
export const removeSetFile = (
	beatmap: LightBeatmap,
	name: string,
): Promise<LightBeatmap> => serially(async () => {
	const { files, file } = await setArchive(beatmap);
	delete files[name];
	return storedAs(await storeLocal(beatmap, files), file);
});

/** `image` added to the set as every difficulty's background; returns the difficulty
 *  as it is now stored, and the image's name in the set. */
export const setBackgroundImage = (
	beatmap: LightBeatmap,
	image: File,
): Promise<{ beatmap: LightBeatmap, name: string }> => serially(async () => {
	const { files, file } = await setArchive(beatmap);
	const name = fileName(image.name);
	files[name] = new Uint8Array(await image.arrayBuffer());
	for (const chart of Object.keys(files).filter(n => n.toLowerCase().endsWith('.osu'))) {
		files[chart] = strToU8(withBackground(strFromU8(files[chart]), name));
	}
	return {
		beatmap: storedAs(await storeLocal(beatmap, files), file), name,
	};
});

/** The set's sample files (wav, ogg, mp3), the song (`song`, its file name) left out. */
export const sampleFiles = async (beatmap: LightBeatmap, song: string): Promise<string[]> => {
	const files = await BeatmapStore.getFiles(beatmap.set.metadata.id);
	return Object.keys(files)
		.filter(name => /\.(wav|ogg|mp3)$/i.test(name) && name.toLowerCase() !== song.toLowerCase())
		.sort();
};

/** The difficulty's stored set, zipped as an .osz. */
export const setOsz = async (beatmap: LightBeatmap): Promise<Uint8Array<ArrayBuffer>> =>
	// fflate zips into a plain ArrayBuffer
	zipSync((await setArchive(beatmap)).files) as Uint8Array<ArrayBuffer>;

/** Download the difficulty's stored set as an .osz. */
export const exportOsz = async (beatmap: LightBeatmap): Promise<void> => {
	const { artist, title } = beatmap.set.metadata;
	const osz = new Blob([await setOsz(beatmap)], { type: 'application/octet-stream' });
	const url = URL.createObjectURL(osz);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName(`${artist} - ${title}.osz`);
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};
