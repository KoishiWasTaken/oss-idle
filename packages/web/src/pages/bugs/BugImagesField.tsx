import { ph } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { BUG_IMAGES_MAX } from '@oss-idle/shared/bugs';

import BugImages from './BugImages';
import type { BugImagesState } from './useBugImages';

/** Attach screenshots: a file picker, or paste them into the text. */
export default function BugImagesField({ pics }: { pics: BugImagesState }) {
	const full = pics.images.length + pics.uploading >= BUG_IMAGES_MAX;
	return <div className='bugs__images'>
		<BugImages images={pics.images} onRemove={pics.remove} />
		<div className='bugs__head'>
			<label className={`bugs__btn ${full ? 'bugs__btn--disabled' : ''}`}>
				<Trans>Add screenshots</Trans>
				<input
					type='file'
					accept='image/png,image/jpeg,image/webp,image/gif'
					multiple
					hidden
					disabled={full}
					onChange={e => {
						void pics.add([...e.target.files ?? []]);
						e.target.value = '';
					}}
				/>
			</label>
			<span className='bugs__muted bugs__small'>
				{pics.uploading
					? <Trans>Uploading…</Trans>
					: <Trans>Up to {ph({ max: BUG_IMAGES_MAX })}, or paste them into the text.</Trans>}
			</span>
		</div>
		{pics.error && <p className='bugs__error'>{pics.error}</p>}
	</div>;
}
