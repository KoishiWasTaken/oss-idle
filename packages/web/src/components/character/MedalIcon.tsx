import './MedalIcon.css';

import { useId } from 'react';

import {
	type MedalLook,
	medalSvg,
} from '@oss-idle/shared/achievements/medal';

// the svg string is generated from our own medal data, never from user input
export default function MedalIcon({ look }: { look: MedalLook }) {
	const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
	return <span
		className='medal-icon'
		dangerouslySetInnerHTML={{ __html: medalSvg(look, `w${uid}`) }}
	/>;
}
