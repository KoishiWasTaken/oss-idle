import './EditableProfilePicture.css';
import { useRef } from 'react';
import ProfilePicture from './ProfilePicture';
import { useAction } from '@oss-idle/shared/hooks/useAction';
import {
	resetAvatar,
	uploadAvatar,
} from '../api/users';
import {
	Trans,
	useLingui,
} from '@lingui/react/macro';

type Props = {
	characterId: number;
	avatarUrl?: string | null;
	className?: string;
	/** Called with the account's new avatar URL after an upload or reset. */
	onChange?: (avatarUrl: string | null) => void;
};

/**
 * A character's avatar the viewer edits: click to upload a custom profile picture,
 * or reset it back to the osu! default. Shown in place of a plain
 * {@link ProfilePicture} when the viewer edits that character.
 */
export default function EditableProfilePicture({
	characterId, avatarUrl, className, onChange,
}: Props) {
	const { t } = useLingui();

	const fileInput = useRef<HTMLInputElement>(null);
	const { busy, error, run: runAction } = useAction();

	const run = async (action: () => Promise<{ avatarUrl: string | null }>) => {
		if (!busy) await runAction(async () => onChange?.((await action()).avatarUrl));
	};

	const pick = (file: File | undefined) => {
		if (file) void run(() => uploadAvatar(characterId, file));
	};

	return (
		<div className={`editable-avatar ${className ?? ''}`}>
			<button
				type="button"
				className="editable-avatar__btn"
				onClick={() => fileInput.current?.click()}
				disabled={busy}
				title={t`Upload a profile picture`}
			>
				<ProfilePicture avatarUrl={avatarUrl} className="editable-avatar__img" />
				<span className="editable-avatar__overlay">{busy ? '…' : 'Change'}</span>
			</button>
			<button
				type="button"
				className="editable-avatar__reset"
				onClick={() => void run(() => resetAvatar(characterId))}
				disabled={busy}
			>
				<Trans>Reset to osu! avatar</Trans>
			</button>
			{error && <span className="editable-avatar__error">{error}</span>}
			<input
				ref={fileInput}
				type="file"
				accept="image/png,image/jpeg,image/webp,image/gif"
				hidden
				onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }}
			/>
		</div>
	);
}
