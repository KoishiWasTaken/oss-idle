import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';

import {
	type Emoji,
	emojiName,
	emojiNameOf,
} from '@oss-idle/shared/community/emoji';

import {
	deleteMyEmoji,
	setMyEmoji,
	updateMyEmoji,
} from '../../api/emoji';

const checked = (raw: string) => {
	const result = emojiName.safeParse(raw);
	if (!result.success) throw new Error(result.error.issues[0]?.message);
	return result.data;
};

/** Upload or replace the image (named after the file when the box is empty), rename, delete;
 *  `disabled` without a supporter tag, deleting stays open. */
export default function EmojiSettingsButtons({
	own, name, shared, disabled, busy, run,
}: {
	own?: Emoji;
	name: string;
	shared: boolean;
	disabled: boolean;
	busy: boolean;
	run: (change: () => Promise<unknown>) => Promise<void>;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const upload = (file: File | undefined) => {
		if (file) void run(() => setMyEmoji(checked(name || emojiNameOf(file.name)), file, shared));
	};

	return <div className='settings__buttons'>
		<button
			type='button'
			className='settings__button'
			disabled={disabled}
			onClick={() => fileRef.current?.click()}
		>{own ? <Trans>Replace image</Trans> : <Trans>Upload image</Trans>}</button>
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
		{own && name.trim().toLowerCase() !== own.name && <button
			type='button'
			className='settings__button'
			disabled={disabled}
			onClick={() => void run(() => updateMyEmoji({ name: checked(name) }))}
		><Trans>Rename</Trans></button>}
		{own && <button
			type='button'
			className='settings__button'
			disabled={busy}
			onClick={() => void run(deleteMyEmoji)}
		><Trans>Delete</Trans></button>}
	</div>;
}
