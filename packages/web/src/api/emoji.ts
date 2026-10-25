import {
	apiUrl,
	rpc,
	unwrap,
} from './client';

export const listEmoji = () => unwrap(rpc.v1.emoji.$get());

export const emojiSrc = (id: number) => apiUrl(`/v1/emoji/${id}`);

/** Admins and the GMT. */
export const addEmoji = (name: string, file: File) =>
	unwrap(rpc.v1.emoji.$post({
		form: {
			name, file,
		},
	}));

export const renameEmoji = (id: number, name: string) =>
	unwrap(rpc.v1.emoji[':id'].$patch({
		param: { id: String(id) }, json: { name },
	}));

export const deleteEmoji = (id: number) =>
	unwrap(rpc.v1.emoji[':id'].$delete({ param: { id: String(id) } }));

/** A supporter's own, replacing the one they had. */
export const setMyEmoji = (name: string, file: File, shared: boolean) =>
	unwrap(rpc.v1.emoji.mine.$put({
		form: {
			name, file, shared: String(shared),
		},
	}));

export const updateMyEmoji = (change: { name?: string; shared?: boolean }) =>
	unwrap(rpc.v1.emoji.mine.$patch({ json: change }));

export const deleteMyEmoji = () => unwrap(rpc.v1.emoji.mine.$delete());
