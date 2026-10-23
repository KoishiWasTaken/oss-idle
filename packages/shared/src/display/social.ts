import {
	__,
	defineMessages,
} from '../i18n/translate.js';
import type { ReportReason } from '../social.js';

const REPORT_REASON_LABELS = defineMessages({
	cheating: 'Cheating',
	multiple_accounts: 'Using multiple accounts',
	chat: 'Inappropriate chat behaviour',
	content: 'Inappropriate content',
	other: 'Other (type below)',
} satisfies Record<ReportReason, string>);

/** The localized label of a report's reason, as osu!web words it. */
export const reportReasonLabel = (reason: ReportReason): string => __(REPORT_REASON_LABELS[reason]);
