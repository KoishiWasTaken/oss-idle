import type { CharacterDTO } from '@oss-idle/shared/character';
import {
	apiUrl,
	json,
	rpc,
	unwrap,
	withAuth,
} from './client';

/** Public: a single user by id. */
export const getUser = (id: number | string) =>
	unwrap(rpc.v1.users[':id'].$get({ param: { id: String(id) } }));

const uploadImage = async (path: string, file: File) => {
	const form = new FormData();
	form.append('file', file);
	return json<CharacterDTO>(await fetch(apiUrl(path), withAuth({
		method: 'POST', body: form, 
	})));
};

/** Upload a custom profile picture for a character the viewer edits; returns the
 *  updated character (with its avatarUrl now pointing at the upload). */
export const uploadAvatar = (characterId: number, file: File) =>
	uploadImage(`/v1/me/avatar?characterId=${characterId}`, file);

/** Remove the custom profile picture, reverting to the osu! avatar. */
export const resetAvatar = (characterId: number) =>
	unwrap(rpc.v1.me.avatar.$delete({ query: { characterId: String(characterId) } }));

/** Upload a profile banner for a character the viewer edits; returns the updated character. */
export const uploadBanner = (characterId: number, file: File) =>
	uploadImage(`/v1/me/banner?characterId=${characterId}`, file);

/** Remove the profile banner. */
export const removeBanner = (characterId: number) =>
	unwrap(rpc.v1.me.banner.$delete({ query: { characterId: String(characterId) } }));

/** Rename a character the viewer edits (same rules as creation); returns the
 *  updated character. The old name joins its permanent name history. */
export const renameCharacter = (characterId: number, name: string) =>
	unwrap(rpc.v1.me.username.$post({
		json: {
			characterId, name,
		},
	}));

/** Show a held medal's name as the signed-in character's title, or clear it. */
export const setTitle = (medalId?: string) =>
	unwrap(rpc.v1.me.title.$put({ json: { medalId } }));
