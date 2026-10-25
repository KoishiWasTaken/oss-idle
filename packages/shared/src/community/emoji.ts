import { z } from 'zod';

/** Discord's names, `+1` and `star-struck` style included. */
export const emojiName = z.string().trim().toLowerCase()
	.regex(/^[a-z0-9_+-]{2,32}$/, 'Emoji names are 2 to 32 letters, digits, _ + or -');

/** Discord's: an image's file name, cut to an emoji name. */
export const emojiNameOf = (fileName: string): string => fileName
	.replace(/\.[^.]*$/, '')
	.toLowerCase()
	.replace(/[^a-z0-9_+-]+/g, '_')
	.slice(0, 32)
	.padEnd(2, '_');

/** Discord's own cap. */
export const EMOJI_MAX_BYTES = 256 * 1024;

export type Emoji = {
	id: number;
	name: string;
	unicode?: string;
	/** a supporter's own, by their current character */
	owner?: { userId: number; characterId?: number; name?: string };
	/** a supporter's that anyone may use */
	shared?: boolean;
};

/** The team's for everyone, a supporter's for themselves unless they shared it. */
export const emojiUsable = (emoji: Emoji, userId?: number): boolean =>
	!emoji.owner || !!emoji.shared || emoji.owner.userId === userId;

/** Variation selector 16: `❤` and `❤️` are the same emoji. */
const bare = (s: string) => s.replace(/\uFE0F/g, '');

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Finds the `:name:` codes and characters of a list of emoji in chat text. */
export const emojiMatcher = (list: readonly Emoji[]) => {
	const byName = new Map(list.map(e => [e.name, e]));
	const byChar = new Map(list.flatMap(e => e.unicode ? [[bare(e.unicode), e] as const] : []));
	const chars = [...byChar.keys()]
		.sort((a, b) => b.length - a.length)
		.map(c => [...c].map(escape).join('\uFE0F?') + '\uFE0F?');
	const pattern = new RegExp([':([a-z0-9_+-]{2,32}):', ...chars].join('|'), 'gi');

	/** The text cut into strings and the emoji between them, those its sender may use. */
	const split = (text: string, senderId?: number): (string | Emoji)[] => {
		const parts: (string | Emoji)[] = [];
		let at = 0;
		for (const m of text.matchAll(pattern)) {
			const emoji = m[1] ? byName.get(m[1].toLowerCase()) : byChar.get(bare(m[0]));
			if (!emoji || !emojiUsable(emoji, senderId)) continue;
			if (m.index > at) parts.push(text.slice(at, m.index));
			parts.push(emoji);
			at = m.index + m[0].length;
		}
		if (at < text.length) parts.push(text.slice(at));
		return parts;
	};
	return {
		list, split, 
	};
};
