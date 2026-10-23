import { Trans } from '@lingui/react/macro';
import Button from './controls/Button';
import { openBugReport } from '../../online/bugReports';

export default function ReportBug() {
	return <Button onClick={() => openBugReport()} label={<Trans>Report a bug</Trans>} />;
}
