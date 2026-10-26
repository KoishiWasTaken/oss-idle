import useSynced from '@oss-idle/shared/hooks/useSynced';

import {
	isWebOpen,
	webUrl,
} from '../../../globals';
import { emoji } from '../../../online/emoji';
import { linkFor } from '../state';
import ChatEmoji from './ChatEmoji';
import { splitLinks } from './links';
import { openChatMap } from './openMap';

/** A line's text cut around the emoji its sender may use. */
type Split = (text: string) => ReturnType<ReturnType<typeof emoji.get>['split']>;

/** The text with its emoji as images. */
const withEmoji = (split: Split, text: string, key: number) => split(text).map((part, i) =>
	typeof part === 'string' ? part : <ChatEmoji key={`${key}.${i}`} emoji={part} />);

/** The text with each map and web address it contains clickable. */
const linked = (split: Split, text: string) => splitLinks(text).flatMap((part, i) => {
	if (typeof part === 'string') return withEmoji(split, part, i);
	const open = 'map' in part
		? () => void openChatMap(part.map)
		: () => void linkFor.set(part.url);
	return <a key={i} className="chat__link" onClick={open}>{part.text}</a>;
});

/** A line's text, its `link` part opening a web platform page; `senderId`'s own emoji drawn. */
export default function ChatText({ text, link, senderId }: {
	text: string,
	link?: { label: string, path: string },
	senderId?: number,
}) {
	const [matcher] = useSynced(emoji);
	const split = (part: string) => matcher.split(part, senderId);
	const at = link ? text.indexOf(link.label) : -1;
	if (!link || at < 0) return <span className="chat__text">{linked(split, text)}</span>;
	const open = () => {
		void webUrl.set(link.path);
		void isWebOpen.set(true);
	};
	return (
		<span className="chat__text">
			{linked(split, text.slice(0, at))}
			<a className="chat__link" onClick={open}>{link.label}</a>
			{linked(split, text.slice(at + link.label.length))}
		</span>
	);
}
