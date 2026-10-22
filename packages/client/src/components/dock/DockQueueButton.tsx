import { useLingui } from '@lingui/react/macro';
import { faListUl } from '@fortawesome/free-solid-svg-icons/faListUl';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { openPage } from '../../globals';
import DockIconButton from './DockIconButton';

type Props = {
	/** the queue view is open: this closes it */
	open?: boolean;
};

/** The way to the queue view, where the queue is managed - and back. */
export default function DockQueueButton({ open = false }: Props) {
	const { t } = useLingui();
	return (
		<DockIconButton
			icon={open ? faXmark : faListUl}
			label={open ? t`Close the queue` : t`Edit the queue`}
			onClick={() => openPage.set(open ? undefined : { page: 'queue' })}
		/>
	);
}
