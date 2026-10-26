import './direct.css';

import { openDirect } from './directState';

/** oss!direct tab on the main menu's right edge */
export default function DirectTab() {
	return (
		<button type='button' className='direct-tab' onClick={() => openDirect()}>
			<svg className='direct-tab__arrow' viewBox='0 0 24 18' aria-hidden>
				<path d='M3 3 H21 L12 15 Z' />
			</svg>
			<span className='direct-tab__label'>
				<span className='direct-tab__oss'>oss!</span>
				<span className='direct-tab__direct'>direct</span>
			</span>
		</button>
	);
}
