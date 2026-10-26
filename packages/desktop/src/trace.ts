import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import { contentTracing } from 'electron';

import { STAGING } from './config';

/**
 * Staging: the game's Ctrl+Shift+F12 (client dev/trace.ts) records up to ten seconds of
 * Chromium's own frame pipeline - which frames reached the screen, which were dropped
 * and at what stage, what got painted and rasterised - and sends it to the staging
 * server beside the profiler's reports. The page can't see any of it: a frame the
 * compositor or the GPU drops still ran its rAF on time.
 */

const TRACE_MS = 10_000;
const CATEGORIES = [
	'benchmark', 'cc', 'gpu', 'gpu.angle', 'viz', 'toplevel', 'renderer.scheduler',
	'devtools.timeline',
	'disabled-by-default-viz.gpu_composite_time',
	'disabled-by-default-devtools.timeline',
	'disabled-by-default-devtools.timeline.frame',
];
// Chromium stops recording once its buffer is full: the default one held 3 seconds
const BUFFER_KB = 1024 * 1024;

let recording: { stop: () => void } | undefined;

async function send(): Promise<string> {
	const file = await contentTracing.stopRecording();
	// compressed off the main process's thread: a sync gzip of a big trace froze the app
	const body = await promisify(gzip)(await fs.readFile(file));
	await fs.rm(file, { force: true });
	const res = await fetch(`${STAGING!.site}/__trace`, {
		method: 'POST', body,
	});
	return res.ok ? `sent (${Math.round(body.length / 1e6)} MB)` : `refused (${res.status})`;
}

/** Record a trace, until ten seconds pass or this is called again; resolves to how
 *  that went. Called while recording, it ends the recording early. */
export async function recordTrace(): Promise<string> {
	if (!STAGING) return 'unavailable';
	if (recording) {
		recording.stop();
		return 'stopping';
	}
	let stop = () => {};
	const stopped = new Promise<void>(resolve => { stop = resolve; });
	recording = { stop };
	try {
		await contentTracing.startRecording({
			included_categories: CATEGORIES,
			recording_mode: 'record-until-full',
			trace_buffer_size_in_kb: BUFFER_KB,
		});
		await Promise.race([stopped, new Promise(resolve => setTimeout(resolve, TRACE_MS))]);
		return await send();
	} catch (e) {
		console.error('[trace]', e);
		return `failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		recording = undefined;
	}
}
