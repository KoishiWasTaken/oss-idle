import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLingui } from '@lingui/react/macro';

import Link from '../../components/Link';
import Nav from '../../components/Nav';

/** osu-web's breadcrumb header links: listing › the build. */
export default function ChangelogNav({ version }: { version?: string }) {
	const { t } = useLingui();
	return (<Nav>
		<Link to='/changelog' className='nav__item'>{t`listing`}</Link>
		{version && <>
			<FontAwesomeIcon icon={faChevronRight} className='changelog__nav-sep' />
			<Link to='/changelog/$version' params={{ version }} className='nav__item'>oss!idle {version}</Link>
		</>}
	</Nav>);
}
