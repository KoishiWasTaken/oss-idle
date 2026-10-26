import './DifficultyBadge.css';

import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
	difficultyColor,
	difficultyTextColor,
	starsText,
} from '@oss-idle/shared/display/difficulty';

/** osu!web's star rating pill, in the difficulty's colour. */
export default function DifficultyBadge({ stars }: { stars: number }) {
	return (
		<span className='difficulty-badge' style={{
			'--bg': difficultyColor(stars), color: difficultyTextColor(stars), 
		} as React.CSSProperties}>
			<span className='difficulty-badge__icon'><FontAwesomeIcon icon={faStar} /></span>
			<span className='difficulty-badge__rating'>{starsText(stars)}</span>
		</span>
	);
}
