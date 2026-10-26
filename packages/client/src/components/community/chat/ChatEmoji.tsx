import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import type { Emoji } from '@oss-idle/shared/community/emoji';

import { emojiSrc } from '../../../online/emoji';

/** An emoji in a chat line; hovered, its code and its supporter's name above it. */
export default function ChatEmoji({ emoji }: { emoji: Emoji }) {
	const [at, setAt] = useState<DOMRect>();
	const name = emoji.owner?.name;
	return <>
		<img
			className="chat__emoji-img"
			src={emojiSrc(emoji.id)}
			alt={`:${emoji.name}:`}
			onMouseEnter={e => setAt(e.currentTarget.getBoundingClientRect())}
			onMouseLeave={() => setAt(undefined)}
		/>
		{at && createPortal(
			<div className="chat__emoji-tooltip" style={{
				left: at.left + at.width / 2, top: at.top,
			}}>
				<span>:{emoji.name}:</span>
				{name && <span className="chat__emoji-tooltip-owner"><Trans>by {name}</Trans></span>}
				{emoji.owner && !emoji.shared && <span className="chat__emoji-tooltip-private">
					<Trans>private</Trans>
				</span>}
			</div>,
			document.body,
		)}
	</>;
}
