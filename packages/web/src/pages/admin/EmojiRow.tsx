import { useState } from 'react';
import {
	type Emoji,
	emojiName,
} from '@oss-idle/shared/community/emoji';
import Link from '../../components/Link';
import {
	deleteEmoji,
	emojiSrc,
	renameEmoji,
} from '../../api/emoji';

/** One emoji: its name renames it once the box loses focus (keyed by name: it starts over after). */
export default function EmojiRow({ emoji, busy, run }: {
	emoji: Emoji;
	busy: boolean;
	run: (change: () => Promise<unknown>) => Promise<void>;
}) {
	const [name, setName] = useState(emoji.name);

	const rename = () => {
		if (name.trim().toLowerCase() === emoji.name) return;
		void run(async () => {
			const checked = emojiName.safeParse(name);
			if (!checked.success) throw new Error(checked.error.issues[0]?.message);
			await renameEmoji(emoji.id, checked.data);
		});
	};

	return <tr>
		<td><img className='admin-emoji__img' src={emojiSrc(emoji.id)} alt={`:${emoji.name}:`} /></td>
		<td>
			<label className='admin-emoji__name'>
				:<input
					value={name}
					maxLength={32}
					disabled={busy}
					onChange={e => setName(e.target.value)}
					onBlur={rename}
					onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
				/>:
			</label>
		</td>
		<td className='admin-emoji__owner'>
			{emoji.owner && <>
				{emoji.owner.characterId
					? <Link to='/c/$id' params={{ id: String(emoji.owner.characterId) }}>{emoji.owner.name}</Link>
					: `#${emoji.owner.userId}`}
				{emoji.shared ? ' · shared with everyone' : ' · only them'}
			</>}
		</td>
		<td className='admin-emoji__actions'>
			<button
				className='admin-list__btn admin-list__btn--warn'
				disabled={busy}
				onClick={() => confirm(`Delete :${emoji.name}:?`) && void run(() => deleteEmoji(emoji.id))}
			>Delete</button>
		</td>
	</tr>;
}
