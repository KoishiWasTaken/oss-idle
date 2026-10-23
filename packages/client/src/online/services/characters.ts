import { InferResponseType } from 'hono/client';
import { rpc } from '../client';
import { unwrap } from '@oss-idle/shared/apiBase';
import MemCache from '@oss-idle/shared/storage/memcache';
import Entities from '../../entity/entities';
import { Score } from '../../db/schema/score';

const endpoint = rpc.v1.characters;

type CharacterResponse = InferResponseType<typeof endpoint[':id']['$get'], 200>;
type CharacterStatsResponse = InferResponseType<typeof endpoint[':id']['stats']['$get'], 200>;

const c1 = MemCache.get<CharacterResponse>('API.getCharacter');
export const flushCharacter = (id: number) => c1.delete(id);
export const getCharacter = async (id: number): Promise<CharacterResponse> => {
	const current = id === Entities.character.get().id;
	return c1.process(id, () => unwrap<CharacterResponse>(
		endpoint[':id'].$get({ param: { id: String(id) } })), 1000 * (current ? 30 : 3600));
};

const c2 = MemCache.get<CharacterStatsResponse>('API.getCharacterStats');
export const flushCharacterStats = (id: number) => c2.delete(id);
export const getCharacterStats = async (
	id: number,
): Promise<CharacterStatsResponse> => {
	const current = id === Entities.character.get().id;
	return c2.process(id, () => unwrap<CharacterStatsResponse>(
		endpoint[':id']['stats'].$get({ param: { id: String(id) } })), 1000 * (current ? 30 : 3600));
};
/** Plays of this map that still train the live character's memory: guests
 *  count their own scores, signed-in characters ask the server that keeps them. */
export const getMemoryPlays = async (beatmapId: number): Promise<number> => {
	const character = Entities.character.get();
	if (character.isGuest()) {
		return Score.countPlays(
			character.id, beatmapId, character.memoryResetAt, character.memoryForgets(),
		);
	}
	return (await unwrap(
		rpc.v1.me.memory[':beatmap'].$get({ param: { beatmap: String(beatmapId) } }))).plays;
};

type CharacterMedalsResponse = InferResponseType<typeof endpoint[':id']['medals']['$get'], 200>;

const c3 = MemCache.get<CharacterMedalsResponse>('API.getCharacterMedals');
export const getCharacterMedals = async (id: number): Promise<CharacterMedalsResponse> =>
	c3.process(id, () => unwrap<CharacterMedalsResponse>(
		endpoint[':id']['medals'].$get({ param: { id: String(id) } })), 1000 * 30);
