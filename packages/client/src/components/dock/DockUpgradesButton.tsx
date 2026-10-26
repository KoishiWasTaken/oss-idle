import { Trans } from '@lingui/react/macro';

import { openPage } from '../../globals';

/** The reason to open the dock while a play runs, and the way to the character
 *  page from anywhere: it reads apart from the queue's controls. */
export default function DockUpgradesButton() {
	return (
		<button
			type="button"
			className="dock__btn dock__btn--upgrades"
			onClick={() => openPage.set({ page: 'character' })}
		>
			<Trans>upgrades</Trans>
		</button>
	);
}
