import { Trans } from '@lingui/react/macro';

import { useAction } from '@oss-idle/shared/hooks/useAction';

type Props = {
	value: string | null,
	onChange: (icon: string | null) => void,
	iconUrl: (icon: string) => string | undefined,
	upload: (file: File) => Promise<string>,
};

/** Icon upload + preview for the add-on and skin editors. */
export default function IconField({ value, onChange, iconUrl, upload }: Props) {
	const { busy, error, run } = useAction();

	const pick = (file: File | undefined) => {
		if (file) void run(async () => onChange(await upload(file)));
	};

	return (
		<div className='listing-field'>
			<span><Trans>Icon</Trans></span>
			<div className='listing-icon-row'>
				{value && <img
					className='listing-icon-preview'
					src={iconUrl(value)}
					alt=''
				/>}
				<label className='listing-btn'>
					<Trans>Upload image</Trans>
					<input
						type='file'
						accept='image/*'
						hidden
						disabled={busy}
						onChange={e => pick(e.target.files?.[0])}
					/>
				</label>
			</div>
			{error && <div className='page__error'>{error}</div>}
		</div>
	);
}
