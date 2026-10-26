import './GroupBadge.css';

import {
	type Group,
	GROUP_BADGE,
} from '@oss-idle/shared/groups';

import Link from '../Link';

/** osu!web's group badge: the group's short name in its colour, its full name on hover, leading
 *  to the group page. */
export default function GroupBadge({ group }: { group: Group }) {
	const { short, name, colour } = GROUP_BADGE[group];
	const style = { '--group-colour': colour } as React.CSSProperties;
	return <Link
		to='/groups/$group'
		params={{ group }}
		className='group-badge'
		style={style}
		title={name}
	>{short}</Link>;
}
