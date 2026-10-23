import { z } from 'zod';
import {
	MAX_DIVISOR,
	type Chart,
	type ChartDoc,
} from './chart.js';

/**
 * What the editor keeps for a difficulty that the .osu format has no place for, in a JSON
 * .oss file beside it: today, the beat snap each BPM point's section is mapped in.
 */
const extrasSchema = z.object({
	version: z.literal(1),
	snaps: z.array(z.object({
		time: z.number(),
		divisor: z.number().int().min(1).max(MAX_DIVISOR),
	})).optional(),
});

/** The .oss file beside the .osu file `osu`. */
export const extrasFile = (osu: string): string => osu.replace(/\.osu$/i, '') + '.oss';

/** `chart` with what its .oss file adds; a missing or unreadable one adds nothing. */
export const withExtras = (chart: Chart, text: string | undefined): Chart => {
	if (!text) return chart;
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		return chart;
	}
	const extras = extrasSchema.safeParse(json);
	if (!extras.success || !extras.data.snaps?.length) return chart;
	const snaps = new Map(extras.data.snaps.map(({ time, divisor }) => [time, divisor]));
	return {
		...chart,
		timing: chart.timing.map(point => {
			const snap = snaps.get(point.time);
			return snap ? {
				...point, snap,
			} : point;
		}),
	};
};

/** The .oss file's text for `doc`, or undefined when it has nothing to keep. */
export const writeExtras = (doc: ChartDoc): string | undefined => {
	const snaps = doc.timing.filter(point => point.snap)
		.map(point => ({
			time: point.time, divisor: point.snap!,
		}));
	if (!snaps.length) return undefined;
	return JSON.stringify({
		version: 1, snaps,
	} satisfies z.infer<typeof extrasSchema>, undefined, '\t') + '\n';
};
