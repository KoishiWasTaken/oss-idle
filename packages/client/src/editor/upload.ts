import type { BeatmapStatus } from '@oss-idle/shared/beatmap';
import Synced from '@oss-idle/shared/helpers/synced';
import type { RulesetId } from '@oss-idle/shared/rulesets/ids';
import { fileIdsOf } from '@oss-idle/shared/rulesets/mania/editor/chart';
import type { CheckId } from '@oss-idle/shared/rulesets/mania/editor/checks';

import API from '../online/api';
import {
	BASE_URL,
	withAuth,
} from '../online/client';
import type LightBeatmap from '../osu/beatmap/LightBeatmap';
import { setOsz } from './save';

export type UploadProblem = { version: string, checks: CheckId[] };

/** The ids the server wrote into an upload's files: the set's, and each .osu's by name. */
export type UploadIds = { setId: number, beatmaps: Record<string, number> };

export type UploadResult =
	| { ok: true, setId: number, updated: boolean, ids: UploadIds }
	| { ok: false, error: string, code?: string, problems: UploadProblem[] };

/**
 * Upload a set as the player's own map. The server reads from its files where it goes
 * (over their set, or up as a new one) and answers with the ids it wrote into them,
 * which the stored set then takes too.
 */
export const uploadSet = async (beatmap: LightBeatmap): Promise<UploadResult> => {
	const form = new FormData();
	form.append('file', new Blob([await setOsz(beatmap)]), 'map.osz');
	const res = await API.fetch(`${BASE_URL}/v1/beatmap/upload`, withAuth({
		method: 'POST', body: form, 
	}));
	const body = await res.json().catch(() => ({}));
	if (!res.ok) return {
		ok: false,
		error: String(body.error ?? res.statusText),
		code: body.code,
		problems: body.problems ?? [],
	};
	uploads.set(uploads.get() + 1);
	return {
		ok: true, setId: body.setId, updated: body.updated, ids: body.ids, 
	};
};

/** Bumped whenever a set's online state changes here (uploaded, submitted, withdrawn). */
export const uploads = new Synced(0);

/** The player's own set online, and where it stands. */
export type OwnSet = {
	setId: number,
	status: BeatmapStatus,
	/** ranked or loved, but not in the game yet */
	scheduled: boolean,
	reviewNote?: string,
};

/** The player's own set a chart's BeatmapSetID names, where it stands in `ruleset`;
 *  undefined when it names none of theirs. */
export const ownSetOf = async (text: string, ruleset: RulesetId): Promise<OwnSet | undefined> => {
	const { setId } = fileIdsOf(text);
	if (setId === undefined) return undefined;
	const path = `${BASE_URL}/v1/beatmap/upload/of/${setId}?ruleset=${ruleset}`;
	const res = await API.fetch(path, withAuth());
	return res.ok ? res.json() : undefined;
};

/** Put the set in `ruleset`'s ranking queue (`submit`), take it back out (`withdraw`), or
 *  unrank the player's own ranked map there (`unrank`). */
export const rankAction = async (
	setId: number,
	action: 'submit' | 'withdraw' | 'unrank',
	ruleset: RulesetId,
): Promise<string | undefined> => {
	const path = `${BASE_URL}/v1/beatmap/upload/${setId}/${action}?ruleset=${ruleset}`;
	const res = await API.fetch(path, withAuth({ method: 'POST' }));
	if (res.ok) uploads.set(uploads.get() + 1);
	return res.ok ? undefined : String((await res.json().catch(() => ({}))).code ?? res.status);
};
