import { msg } from '@lingui/core/macro';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import { RULESET_IDS } from '@oss-idle/shared/rulesets/ids';

import {
	getCharacter,
	getCharacterStats,
} from '../../api/characters';
import CharacterPage from '../../pages/characters/CharacterPage';

/** `?ruleset=`: the profile in another ruleset than the one the character plays. */
const search = z.object({ ruleset: z.enum(RULESET_IDS).optional() });

export const Route = createFileRoute('/c/$id')({
	validateSearch: zodValidator(search),
	loaderDeps: ({ search: { ruleset } }) => ({ ruleset }),
	loader: ({ params, deps: { ruleset } }) =>
		Promise.all([getCharacter(params.id, ruleset), getCharacterStats(params.id, ruleset)]),
	component: CharacterRoute,
	staticData: { title: msg`character info` },
});

function CharacterRoute() {
	const { id } = Route.useParams();
	const [character, stats] = Route.useLoaderData();
	return (
		<CharacterPage key={`${id}:${character.ruleset}`} id={id} character={character} stats={stats} />
	);
}
