import './ProfileBanner.css';
import {
	useRef,
	useState,
} from 'react';
import {
	removeBanner,
	uploadBanner,
} from '../../api/users';
import { useAction } from '@oss-idle/shared/hooks/useAction';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';

type Props = {
	characterId: number;
	bannerUrl?: string;
	/** The viewer edits this character: show upload / remove. */
	editable?: boolean;
};

/** The profile's cover image, black without one. */
export default function ProfileBanner({ characterId, bannerUrl, editable }: Props) {
	const { t } = useLingui();

	const fileInput = useRef<HTMLInputElement>(null);
	const [url, setUrl] = useState(bannerUrl);
	const { busy, error, run: runAction } = useAction();

	const run = async (action: () => Promise<{ bannerUrl?: string }>) => {
		if (!busy) await runAction(async () => setUrl((await action()).bannerUrl));
	};

	const pick = (file: File | undefined) => {
		if (file) void run(() => uploadBanner(characterId, file));
	};

	return (
		<div className='character__banner' style={url ? { backgroundImage: `url("${url}")` } : undefined}>
			{editable && (
				<div className='profile-banner__actions'>
					{error && <span className='profile-banner__error'>{error}</span>}
					<button
						type='button'
						className='profile-banner__btn'
						onClick={() => fileInput.current?.click()}
						disabled={busy}
					>
						{busy ? '…' : url ? t`Change banner` : t`Upload banner`}
					</button>
					{url && (
						<button
							type='button'
							className='profile-banner__btn'
							onClick={() => void run(() => removeBanner(characterId))}
							disabled={busy}
						>
							<Trans>Remove</Trans>
						</button>
					)}
					<input
						ref={fileInput}
						type='file'
						accept='image/png,image/jpeg,image/webp,image/gif'
						hidden
						onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }}
					/>
				</div>
			)}
		</div>
	);
}
