import {
	unzip,
	Unzipped,
} from 'fflate';
import type { InferResponseType } from 'hono/client';
import sleep from '@oss-idle/shared/helpers/sleep';
import API from '../../online/api';
import {
	BASE_URL,
	rpc,
} from '../../online/client';
import Socket from '../../online/socket';
import { SETTINGS } from '../../db/settings';
import BeatmapStore, {
	SetRecord,
	beatmapsVersion,
} from './beatmap_store';

/** The live catalog and its metadata types, as returned by the server. */
export type Manifest = InferResponseType<typeof rpc.v1.beatmap.catalog.$get>;
export type Metadata = Manifest['beatmaps'][number];
export type VersionMetadata = Metadata['versions'][number];

const PARALLEL_DOWNLOADS = 4;
let downloading = 0;
const waiting: (() => void)[] = [];

/** Waits for one of the parallel download slots; call the result to hand it on. */
const downloadSlot = async (): Promise<() => void> => {
	if (downloading < PARALLEL_DOWNLOADS) downloading++;
	else await new Promise<void>(resolve => waiting.push(resolve));
	return () => {
		const next = waiting.shift();
		if (next) next();
		else downloading--;
	};
};

/** In song select before it is downloaded. */
export const isListed = (meta: Metadata) =>
	SETTINGS.showUndownloaded.get() && (meta.bundled || SETTINGS.showUnbundled.get());

export default class BeatmapAPI {

	private static manifest?: Promise<Manifest>;

	/** Resolve a catalog asset path (preview audio/background, already
	 *  server-rooted as `/v1/beatmap/preview/...`) to a full URL on the API. */
	public static assetUrl(path: string | undefined): string | undefined {
		if (!path) return undefined;
		return `${BASE_URL}${path}`;
	}

	/** Drop the cached catalog and bump the library version so song select
	 *  refetches. Pushed by the server when the catalog changes. */
	public static invalidate(): void {
		this.manifest = undefined;
		void beatmapsVersion.set(beatmapsVersion.get() + 1);
	}

	public static getManifest(): Promise<Manifest> {
		return this.manifest ??= (async () => {
			const manifest = await (await rpc.v1.beatmap.catalog.$get()).json();
			// Diffs unranked since the last download must vanish locally too.
			await BeatmapStore.pruneToManifest(manifest).catch(console.error);
			return manifest;
		})().catch(err => {
			// don't cache a failed fetch - the next call retries
			this.manifest = undefined;
			throw err;
		});
	}

	/** `bulk`: one of many in a row, which the server sends rate-capped. */
	public static async downloadOsz(
		metadata: Metadata,
		onProgress?: (progress: number) => void,
		bulk = false,
	): Promise<SetRecord> {
		const existing = await BeatmapStore.getSet(metadata.id);
		if (existing) return existing;

		const release = await downloadSlot();
		let buf: Uint8Array;
		try {
			const url = `${BASE_URL}/v1/beatmap/osz/${metadata.id}${bulk ? '?bulk' : ''}`;
			let res = await API.fetch(url);
			// over the server's 10 downloads per address (another device or tab)
			while (res.status === 429) {
				await sleep(2_000);
				res = await API.fetch(url);
			}
			if (!res.ok) throw new Error(`Download of set ${metadata.id} failed: ${res.status}`);
			buf = await this.readWithProgress(res, onProgress);
		} finally {
			release();
		}
		const files = await new Promise<Unzipped>((resolve, reject) => {
			unzip(buf, (err, data) => (err ? reject(err) : resolve(data)));
		});

		return await BeatmapStore.storeOsz(metadata, files);
	}

	/**
	 * Read a response body into a single buffer, reporting download progress
	 * (0..1) against Content-Length. Falls back to a plain arrayBuffer read when
	 * no callback is given or the body can't be streamed (e.g. length unknown).
	 */
	private static async readWithProgress(
		res: Response,
		onProgress?: (progress: number) => void,
	): Promise<Uint8Array> {
		const total = Number(res.headers.get('content-length')) || 0;
		if (!onProgress || !res.body || !total) {
			return new Uint8Array(await res.arrayBuffer());
		}

		const reader = res.body.getReader();
		const chunks: Uint8Array[] = [];
		let loaded = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			loaded += value.length;
			onProgress(loaded / total);
		}
		onProgress(1);

		const out = new Uint8Array(loaded);
		let offset = 0;
		for (const chunk of chunks) {
			out.set(chunk, offset);
			offset += chunk.length;
		}
		return out;
	}

	public static async isDownloaded(metadata: Metadata): Promise<boolean> {
		return BeatmapStore.has(metadata.id);
	}

}

Socket.on('catalog:invalidate', () => BeatmapAPI.invalidate());
