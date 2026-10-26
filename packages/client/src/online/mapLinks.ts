import {
	ph,
	t,
} from '@lingui/core/macro';

import { MAP_LINK_CHANNEL } from '@oss-idle/shared/beatmap';
import { desktop } from '@oss-idle/shared/desktop';

import { message } from '../globals';
import BeatmapAPI from '../osu/beatmap/beatmap_api';

/** `oss-idle://dl/<setId>` from the site: download that set into the library. */
const open = async (link: string) => {
	const url = URL.parse(link);
	if (url?.host !== 'dl') return;
	const id = Number(url.pathname.slice(1));
	const meta = await BeatmapAPI.setMetadata(id);
	if (!meta) return;
	if (await BeatmapAPI.isDownloaded(meta)) {
		message.set(t`${ph({ title: meta.title })} is already downloaded`);
		return;
	}
	message.set(t`Downloading ${ph({ title: meta.title })}...`);
	try {
		await BeatmapAPI.downloadOsz(meta);
		message.set(t`Downloaded ${ph({ title: meta.title })}`);
	} catch (e) {
		console.error('[mapLinks] download failed', e);
		message.set(t`Could not download ${ph({ title: meta.title })}`);
	}
};

const channel = new BroadcastChannel(MAP_LINK_CHANNEL);
channel.onmessage = (e: MessageEvent) => {
	if (typeof e.data !== 'string') return;
	channel.postMessage(true);
	void open(e.data);
};

desktop()?.onDeepLink(link => void open(link));
