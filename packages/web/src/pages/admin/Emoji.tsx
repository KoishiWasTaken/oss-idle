import './Medals.css';
import './AdminList.css';
import '../search/Search.css';
import './Emoji.css';
import {
	useEffect,
	useRef,
	useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useAction } from '@oss-idle/shared/hooks/useAction';
import { emojiNameOf } from '@oss-idle/shared/community/emoji';
import {
	addEmoji,
	listEmoji,
} from '../../api/emoji';
import EmojiRow from './EmojiRow';

type Listed = Awaited<ReturnType<typeof listEmoji>>[number];

/** The chat's emoji, Discord's server settings tab: upload, rename, delete. */
export default function Emoji() {
	const [list, setList] = useState<Listed[]>();
	const [filter, setFilter] = useState('');
	const [supporters, setSupporters] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
	const {
		busy, error, run,
	} = useAction();

	const refresh = () => listEmoji().then(setList);
	useEffect(() => { void run(refresh); }, []);

	const upload = (file: File | undefined) => {
		if (file) void run(() => addEmoji(emojiNameOf(file.name), file), refresh);
	};
	const shown = list?.filter(e =>
		e.name.includes(filter.trim().toLowerCase()) && (!supporters || e.owner));

	return <main className='admin-medals admin-emoji'>
		<p className='admin-medals__meta'>
			The chat draws these as images: typed as <code>:name:</code>, or as the character for the
			ones from Discord. PNG, JPEG, GIF or WebP, 256 KB at most, named after the file: rename one
			in its box. Names are 2 to 32 letters, digits, _ + or -. Each supporter may add one of their
			own in their settings, for themselves or shared with everyone: delete it here if it's a
			problem.
		</p>
		<div className='admin-emoji__bar'>
			<button
				className='admin-list__btn admin-list__btn--primary'
				disabled={busy}
				onClick={() => fileRef.current?.click()}
			>Upload Emoji</button>
			<input
				ref={fileRef}
				type='file'
				accept='image/png,image/jpeg,image/gif,image/webp'
				hidden
				onChange={e => {
					upload(e.target.files?.[0]);
					e.target.value = '';
				}}
			/>
			<label className='search__box'>
				<FontAwesomeIcon icon={faMagnifyingGlass} />
				<input
					value={filter}
					onChange={e => setFilter(e.target.value)}
					placeholder='Search emoji'
				/>
			</label>
			<label className='admin-emoji__check'>
				<input type='checkbox' checked={supporters} onChange={e => setSupporters(e.target.checked)} />
				Supporters' only
			</label>
			{list && <span className='admin-medals__meta'>{list.length} emoji</span>}
		</div>
		{error && <p className='admin-emoji__error'>{error}</p>}
		{!shown && <p>Loading…</p>}
		{shown && <table>
			<thead><tr><th>Image</th><th>Name</th><th>Supporter</th><th></th></tr></thead>
			<tbody>
				{shown.map(e => <EmojiRow
					key={`${e.id}:${e.name}`}
					emoji={e}
					busy={busy}
					run={change => run(change, refresh)}
				/>)}
			</tbody>
		</table>}
	</main>;
}
