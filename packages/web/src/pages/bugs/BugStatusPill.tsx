import type { BugStatus } from '@oss-idle/shared/bugs';

import { useBugStatusLabels } from './useBugStatusLabels';

export default function BugStatusPill({ status }: { status: BugStatus }) {
	const label = useBugStatusLabels();
	return <span className={`bug-status bug-status--${status}`}>{label[status]}</span>;
}
