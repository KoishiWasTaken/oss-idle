import type { SkinStatus } from '@oss-idle/shared/skin';

import {
	listSkinsAdmin,
	moderateSkin,
} from '../../api/skins';
import AdminList from './AdminList';
import SkinRow from './SkinRow';

// Unpublished first: those wait for a review.
const STATUS_ORDER: Record<SkinStatus, number> = {
	UNPUBLISHED: 0, PUBLISHED: 1,
};

export default function SkinsAdmin() {
	return (
		<AdminList
			load={listSkinsAdmin}
			statusOrder={STATUS_ORDER}
			noun='skins'
			renderRow={(row, busy, act) => (
				<SkinRow
					key={row.id}
					row={row}
					busy={busy}
					onModerate={(id, body) => act(() => moderateSkin(id, body))}
				/>
			)}
		/>
	);
}
