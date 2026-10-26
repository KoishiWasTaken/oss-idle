import { eq } from 'drizzle-orm';

import {
	type RulesetId,
	rulesetOf,
} from '@oss-idle/shared/rulesets/ids';

import { db } from '../db/client';
import { beatmaps } from '../db/schema/beatmap';
import { ENABLED_RULESETS } from './enabled';
import type { ServerRuleset } from './ruleset';

type Loader = () => Promise<{ ruleset: ServerRuleset }>;
const loaders: Record<RulesetId, Loader> = {
	mania4k: () => import('./mania/4k/index'),
	mania7k: () => import('./mania/7k/index'),
	osu: () => import('./osu/index'),
};

const loaded = new Map<RulesetId, ServerRuleset>();

/** Import the rulesets this server plays - only those: the others are never loaded.
 *  Runs once before anything serves (boot, a script's start). Not at import time: the
 *  rulesets import modules that import this one. */
export const loadRulesets = async (): Promise<void> => {
	for (const id of ENABLED_RULESETS) {
		loaded.set(id, (await loaders[id]()).ruleset);
	}
};

/** A ruleset this server plays; throws for any other. */
export const rulesetFor = (id: RulesetId): ServerRuleset => {
	const ruleset = loaded.get(id);
	if (!ruleset) throw new Error(`ruleset ${id} is not enabled`);
	return ruleset;
};

/** The ruleset that plays a chart of this mode and key count, when this server plays it. */
export const rulesetOfChart = (mode: number, keys: number): ServerRuleset | undefined => {
	const id = rulesetOf(mode, keys);
	return id === undefined ? undefined : loaded.get(id);
};

/** The ruleset a stored difficulty is played in, when this server plays it. */
export const rulesetOfBeatmap = async (beatmapId: number): Promise<ServerRuleset | undefined> => {
	const [row] = await db.select({
		mode: beatmaps.mode, keys: beatmaps.keys, 
	})
		.from(beatmaps).where(eq(beatmaps.id, beatmapId)).limit(1);
	return row && rulesetOfChart(row.mode, row.keys);
};

/** Every ruleset this server plays. */
export const enabledRulesets = (): ServerRuleset[] => [...loaded.values()];

/** The ruleset a character picked, or this server's first when it doesn't play that one. */
export const selectedRuleset = (character: { ruleset: RulesetId }): ServerRuleset =>
	loaded.get(character.ruleset) ?? enabledRulesets()[0];

/** A script's `--ruleset <id>`, mania 4k when left out. */
export const rulesetFromArgs = (argv: readonly string[] = process.argv): ServerRuleset => {
	const i = argv.indexOf('--ruleset');
	return rulesetFor((i === -1 ? 'mania4k' : argv[i + 1]) as RulesetId);
};
