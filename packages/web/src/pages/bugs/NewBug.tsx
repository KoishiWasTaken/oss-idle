import './Bugs.css';
import {
	type FormEvent,
	useEffect,
	useState,
} from 'react';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';
import { ph } from '@lingui/core/macro';
import { useNavigate } from '@tanstack/react-router';
import { VERSION } from '@oss-idle/shared/version';
import { desktop } from '@oss-idle/shared/desktop';
import {
	BUG_SETUP_CHANNEL,
	BUG_TEXT_MAX,
} from '@oss-idle/shared/bugs';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { reportBug } from '../../api/bugs';
import { useBugImages } from './useBugImages';
import BugImagesField from './BugImagesField';

const client = () => [
	desktop() ? 'desktop app' : 'browser',
	`${innerWidth}x${innerHeight}@${devicePixelRatio}`,
	navigator.userAgent,
].join(' · ').slice(0, 500);

/** The add-ons and skins of the game this form is in, or of a game open in another tab. */
const useGameSetup = () => {
	const [setup, setSetup] = useState<string>();
	useEffect(() => {
		const channel = new BroadcastChannel(BUG_SETUP_CHANNEL);
		channel.onmessage = (e: MessageEvent) => {
			if (typeof e.data === 'string') setSetup(e.data);
		};
		channel.postMessage('setup');
		return () => channel.close();
	}, []);
	return setup;
};

/** The form the game's options open. */
export default function NewBug() {
	const { t } = useLingui();
	const user = useCurrentUser();
	const navigate = useNavigate();
	const [title, setTitle] = useState('');
	const [body, setBody] = useState('');
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string>();
	const pics = useBugImages();
	const setup = useGameSetup();

	if (!user) return <div className='page-contents'><Trans>Sign in to report a bug.</Trans></div>;

	const send = async () => {
		setSending(true);
		setError(undefined);
		try {
			const { id } = await reportBug({
				title, body, images: pics.images, version: VERSION, client: client(), setup,
			});
			await navigate({
				to: '/bugs/$id', params: { id: String(id) },
			});
		} catch (e) {
			setError((e as Error).message);
			setSending(false);
		}
	};

	const submit = (e: FormEvent) => {
		e.preventDefault();
		void send();
	};

	return <form className='page-contents bugs bugs__form' onSubmit={submit}>
		<p className='bugs__muted'>
			<Trans>
				Tell us what went wrong: what you were doing, what you expected and what happened instead.
				The team answers here, and you can add more details later.
			</Trans>
		</p>
		<label className='bugs__field'>
			<span><Trans>Title</Trans></span>
			<input
				value={title}
				onChange={e => setTitle(e.target.value)}
				maxLength={120}
				placeholder={t`A short summary`}
			/>
		</label>
		<label className='bugs__field'>
			<span><Trans>Description</Trans></span>
			<textarea
				value={body}
				onChange={e => setBody(e.target.value)}
				onPaste={pics.paste}
				maxLength={BUG_TEXT_MAX}
				rows={10}
			/>
		</label>
		<BugImagesField pics={pics} />
		<p className='bugs__muted bugs__small'>
			{desktop()
				? <Trans>Sent with it: version {ph({ version: VERSION })} and your desktop app.</Trans>
				: <Trans>Sent with it: version {ph({ version: VERSION })} and your browser.</Trans>}
			{setup && <> <Trans>Also your add-ons and skins.</Trans></>}
		</p>
		{error && <p className='bugs__error'>{error}</p>}
		<div>
			<button
				type='submit'
				className='bugs__btn bugs__btn--accent'
				disabled={sending || !!pics.uploading || !title.trim() || !body.trim()}
			>
				<Trans>Send report</Trans>
			</button>
		</div>
	</form>;
}
