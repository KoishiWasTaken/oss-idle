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
		view: 'manage',
	});
};

export default function ManageAddons() {
	return <Button onClick={open} label={<Trans>Manage add-ons</Trans>} />;
}
