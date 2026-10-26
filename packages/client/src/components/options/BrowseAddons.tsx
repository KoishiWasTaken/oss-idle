import { Trans } from '@lingui/react/macro';

import {
	isOptionsOpen,
	openPage,
} from '../../globals';
import Button from './controls/Button';

const open = () => {
	isOptionsOpen.set(false);
	openPage.set({
		page: 'addons',
		view: 'browse',
	});
};

export default function BrowseAddons() {
	return <Button onClick={open} label={<Trans>Browse add-ons</Trans>} />;
}
