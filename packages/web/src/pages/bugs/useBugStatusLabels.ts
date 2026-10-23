import { useLingui } from '@lingui/react/macro';
import type { BugStatus } from '@oss-idle/shared/bugs';

export const useBugStatusLabels = (): Record<BugStatus, string> => {
	const { t } = useLingui();
	return {
		open: t`Open`,
		confirmed: t`Confirmed`,
		fixed: t`Fixed`,
		closed: t`Closed`,
	};
};
