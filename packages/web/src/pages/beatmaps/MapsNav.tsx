import { useLingui } from '@lingui/react/macro';

import Link from '../../components/Link';
import Nav from '../../components/Nav';

export default function MapsNav({ current }: {
	current: 'listing' | 'requests' | 'levels',
}) {
	const { t } = useLingui();

	const item = (id: string) => `nav__item ${id === current ? 'current' : ''}`;

	return (<Nav>
		<Link
			to='/maps'
			search={{
				sort: 'date', dir: 'desc',
			}}
			className={item('listing')}
		>
			{t`beatmap listing`}
		</Link>
		<Link
			to='/maps/requests'
			search={{
				filter: 'open', sort: 'support', page: 1,
			}}
			className={item('requests')}
		>
			{t`map requests`}
		</Link>
		<Link to='/maps/levels' className={item('levels')}>
			{t`level calibration`}
		</Link>
	</Nav>);
}
