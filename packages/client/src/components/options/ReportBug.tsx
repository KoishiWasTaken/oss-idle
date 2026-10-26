import { Trans } from '@lingui/react/macro';

import { openBugReport } from '../../online/bugReports';
import Button from './controls/Button';

export default function ReportBug() {
	return <Button onClick={() => openBugReport()} label={<Trans>Report a bug</Trans>} />;
}
