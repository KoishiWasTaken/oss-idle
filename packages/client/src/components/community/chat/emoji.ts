import type { Emoji } from '@oss-idle/shared/community/emoji';

// more would stick out of the top of the chat panel
const EMOJI_SUGGESTIONS = 6;

// the `:query` at the end of the draft, two characters at least
export const emojiQuery = (draft: string): string | undefined =>
	/(?:^|\s):([a-z0-9_+-]{2,})$/i.exec(draft)?.[1]?.toLowerCase();

// names starting with the query (shortest first), then names containing it
export const matchEmoji = (list: readonly Emoji[], query: string): Emoji[] => {
	const starts = list.filter(e => e.name.startsWith(query));
	const contains = list.filter(e => !e.name.startsWith(query) && e.name.includes(query));
	return [
		...starts.sort((a, b) => a.name.length - b.name.length),
		...contains,
	].slice(0, EMOJI_SUGGESTIONS);
};
