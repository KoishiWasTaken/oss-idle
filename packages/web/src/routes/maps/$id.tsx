import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';
import {
	fallback,
	zodValidator,
} from '@tanstack/zod-adapter';
import { z } from 'zod';

import { RULESET_IDS } from '@oss-idle/shared/rulesets/ids';

import { getMapset } from '../../api/maps';
import BeatmapsetPage from '../../pages/beatmaps/BeatmapsetPage';

const mapSearch = z.object({
	ruleset: z.enum(RULESET_IDS).optional().catch(undefined),
	diff: z.coerce.number().int().optional().catch(undefined),
	board: fallback(z.enum(['global', 'country', 'friends']), 'global').default('global'),
});

export const Route = createFileRoute('/maps/$id')({
	validateSearch: zodValidator(mapSearch),
	loaderDeps: ({ search: { ruleset } }) => ({ ruleset }),
	loader: ({ params, deps: { ruleset } }) => getMapset(params.id, ruleset),
	component: MapRoute,
	staticData: { title: msg`beatmap info` },
});

function MapRoute() {
	const mapset = Route.useLoaderData();
	const { diff, board } = Route.useSearch();
	return <BeatmapsetPage mapset={mapset} diffId={diff} board={board} />;
}
