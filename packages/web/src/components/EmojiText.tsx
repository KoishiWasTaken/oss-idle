import type { emojiMatcher } from '@oss-idle/shared/community/emoji';
import { emojiSrc } from '../api/emoji';

/** Chat text with its emoji as images, as the game draws them. */
export default function EmojiText({ text, split, senderId }: {
	text: string;
	split?: ReturnType<typeof emojiMatcher>['split'];
	senderId?: number;
}) {
	if (!split) return text;
	return split(text, senderId).map((part, i) => typeof part === 'string' ? part : <img
		key={i}
		className='emoji-text'
		src={emojiSrc(part.id)}
		alt={`:${part.name}:`}
	/>);
}
