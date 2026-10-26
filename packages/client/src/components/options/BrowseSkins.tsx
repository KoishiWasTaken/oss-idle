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
		view: 'browse',
	});
};

export default function BrowseSkins() {
	return <Button onClick={open} label={<Trans>Browse skins</Trans>} />;
}
