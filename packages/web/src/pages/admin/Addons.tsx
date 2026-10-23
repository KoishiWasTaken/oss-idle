import './Addons.css';

import type { AddonStatus } from '@oss-idle/shared/addon';
import {
	listAddonsAdmin,
	moderateAddon,
	setAddonTrusted,
} from '../../api/addons';
import AddonRow from './AddonRow';
import AdminList from './AdminList';

// Pending first in the queue, then on-hold, then published.
const STATUS_ORDER: Record<AddonStatus, number> = {
	pending: 0, onHold: 1, published: 2, denied: 3, unpublished: 4,
};

export default function AddonsAdmin() {
	return (
		<AdminList
			load={listAddonsAdmin}
			statusOrder={STATUS_ORDER}
			noun='add-ons'
			renderRow={(row, busy, act) => (
				<AddonRow
					key={row.id}
					row={row}
					busy={busy}
					onModerate={(id, body) => act(() => moderateAddon(id, body))}
					onTrusted={(id, trusted) => act(() => setAddonTrusted(id, trusted))}
				/>
			)}
		/>
	);
}
