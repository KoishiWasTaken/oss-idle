import Synced from '@oss-idle/shared/helpers/synced';
import { emojiMatcher } from '@oss-idle/shared/community/emoji';
import {
	apiUrl,
	rpc,
} from './client';
import { isCommunityOpen } from '../globals';

/** The chat's emoji. The team adds them on the web: re-read whenever the overlay opens. */
export const emoji = new Synced(emojiMatcher([]));

export const emojiSrc = (id: number) => apiUrl(`/v1/emoji/${id}`);

const load = async (): Promise<void> => {
	try {
		const res = await rpc.v1.emoji.$get();
		if (res.ok) void emoji.set(emojiMatcher(await res.json()));
	} catch (e) {
		console.warn('[emoji] could not load', e);
	}
};

// the ticker shows chat with the overlay closed
void load();
void isCommunityOpen.sync(open => { if (open) void load(); });
