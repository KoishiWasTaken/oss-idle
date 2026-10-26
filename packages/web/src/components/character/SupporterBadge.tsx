import './SupporterBadge.css';

import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLingui } from '@lingui/react/macro';

import Link from '../Link';

/** The profile's supporter pill: one heart per support level. */
export default function SupporterBadge({ level }: { level: number }) {
	const { t } = useLingui();
	if (!level) return null;
	return <Link to='/store' className='supporter-badge' title={t`supporter`}>
		{Array.from({ length: level }, (_, i) => <FontAwesomeIcon key={i} icon={faHeart} />)}
	</Link>;
}
