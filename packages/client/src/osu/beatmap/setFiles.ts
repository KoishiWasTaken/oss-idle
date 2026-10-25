import type {
	RuntimeMetadata,
	RuntimeVersionMetadata,
} from './beatmap_store';

const MIME: Record<string, string> = {
	mp3: 'audio/mpeg',
	ogg: 'audio/ogg',
	wav: 'audio/wav',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	mp4: 'video/mp4',
	webm: 'video/webm',
	m4v: 'video/mp4',
	avi: 'video/x-msvideo',
	flv: 'video/x-flv',
};

export const mime = (name: string): string =>
	MIME[name.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream';

// osu references assets case-insensitively and treats \ and / as the same
// separator, while zip entries use /. Normalize both when storing and reading so
// a reference resolves regardless of separator/case - this only matches keys, it
// never alters the stored bytes or the path inside the chart.
export const normalizeName = (name: string) => name.toLowerCase().replace(/\\/g, '/');

export const isChart = (name: string) => name.toLowerCase().endsWith('.osu');

export const fileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, '');

/** A difficulty's .osu name, or the one osu! would give it when the store lost it. */
export const chartFile = (set: RuntimeMetadata, version: RuntimeVersionMetadata): string =>
	version.file ?? fileName(`${set.artist} - ${set.title} (${set.creator}) [${version.version}].osu`);
