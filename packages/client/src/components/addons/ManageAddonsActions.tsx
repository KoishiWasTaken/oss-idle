import { Trans } from '@lingui/react/macro';
import PageBarActions from '../page/PageBarActions';
import { library } from '../../library';

type Props = {
	/** signed in: make a new add-on */
	onCreate?: () => void,
};

/** The add-ons page's bar: a new add-on, the add-ons folder (desktop). */
export default function ManageAddonsActions({ onCreate }: Props) {
	return (
		<PageBarActions actions={[
			...onCreate ? [{
				id: 'create',
				label: <Trans>Create new add-on</Trans>,
				onClick: onCreate,
				order: 10,
			}] : [],
			...library() ? [{
				id: 'open-folder',
				label: <Trans>Open the add-ons folder</Trans>,
				onClick: () => void library()!.reveal('addons'),
				order: 11,
			}] : [],
		]} />
	);
}
