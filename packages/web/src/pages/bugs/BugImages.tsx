import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { apiUrl } from '../../api/client';

/** Screenshots as thumbnails, each opening full size; removable while writing. */
export default function BugImages({ images, onRemove }: {
	images: string[];
	onRemove?: (url: string) => void;
}) {
	if (!images.length) return null;
	return <div className='bug-images'>
		{images.map(url => <div key={url} className='bug-images__item'>
			<a href={apiUrl(url)} target='_blank' rel='noreferrer'>
				<img src={apiUrl(url)} alt='' />
			</a>
			{onRemove && <button type='button' className='bug-images__remove' onClick={() => onRemove(url)}>
				<FontAwesomeIcon icon={faXmark} />
			</button>}
		</div>)}
	</div>;
}
