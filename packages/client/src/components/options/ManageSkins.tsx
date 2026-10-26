import { Trans } from '@lingui/react/macro';

import {
	isOptionsOpen,
	openPage,
} from '../../globals';
import Button from './controls/Button';

const open = () => {
	isOptionsOpen.set(false);
	openPage.set({
		page: 'skins',
		view: 'manage',
	});
};

export default function ManageSkins() {
	return <Button onClick={open} label={<Trans>Manage skins</Trans>} />;
}
