import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import {
	useEffect,
	useState,
} from 'react';

import type { Emoji } from '@oss-idle/shared/community/emoji';

import {
	emojiSrc,
	listEmoji,
	updateMyEmoji,
} from '../../api/emoji';
import Link from '../../components/Link';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import EmojiSettingsButtons from './EmojiSettingsButtons';
import { useAction } from './useAction';

/** A supporter's own chat emoji: one, for themselves or shared with everyone. */
export default function EmojiSettings() {
	const { t } = useLingui();
	const user = useCurrentUser();
	const [mine, setMine] = useState<Emoji | 'none'>();
	const [name, setName] = useState('');
	const [shared, setShared] = useState(false);
	const {
		busy, error, run,
	} = useAction();

	const refresh = () => listEmoji().then(list => {
		const own = list.find(e => e.owner?.userId === user?.id);
		setMine(own ?? 'none');
		setName(own?.name ?? '');
		setShared(own?.shared ?? false);
	});
	useEffect(() => { void run(refresh); }, [user?.id]);
	if (!user || !mine) return <Trans>Loading…</Trans>;

	const own = mine === 'none' ? undefined : mine;
	const share = (next: boolean) => {
		setShared(next);
		if (own) void run(() => updateMyEmoji({ shared: next }), refresh);
	};

	return <>
		<div className='settings__hint'>
			<Trans>
				An emoji of your own for the chat, typed as :name:. Only you can use it unless you share
				it with everyone.
			</Trans>
		</div>
		{!user.supporter && <div className='settings__hint'>
			<Trans>
				Adding or renaming it needs an <Link to='/store'>oss!supporter</Link> tag. You keep it even
				if your supporter tag ends.
			</Trans>
		</div>}
		{error && <div className='settings__hint settings__hint--error'>{error}</div>}
		<div className='settings__emoji'>
			{own
				? <img className='settings__emoji-img' src={emojiSrc(own.id)} alt={`:${own.name}:`} />
				: <span className='settings__emoji-img' />}
			<label className='settings__emoji-name'>
				:<input
					value={name}
					maxLength={32}
					placeholder={t`name`}
					disabled={busy || !user.supporter}
					onChange={e => setName(e.target.value)}
				/>:
			</label>
			<label className='settings__radio'>
				<input
					type='checkbox'
					className='settings__check'
					checked={shared}
					disabled={busy}
					onChange={e => share(e.target.checked)}
				/>
				<Trans>Anyone can use it</Trans>
			</label>
		</div>
		<EmojiSettingsButtons
			own={own}
			name={name}
			shared={shared}
			disabled={busy || !user.supporter}
			busy={busy}
			run={change => run(change, refresh)}
		/>
	</>;
}
