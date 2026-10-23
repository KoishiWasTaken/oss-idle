import { t } from '@lingui/core/macro';
import Log, { POPUP_TYPE } from '@oss-idle/shared/helpers/log';
import {
	isOptionsOpen,
	isWebOpen,
	webUrl,
} from '../globals';
import Socket from './socket';

/** A report on the site, or the form for a new one. */
export const openBugReport = (id?: number) => {
	isOptionsOpen.set(false);
	void webUrl.set(id ? `bugs/${id}` : 'bugs/new');
	void isWebOpen.set(true);
};

Socket.on('bug:reply', ({ id, title }) => Log.popup(
	t`The team answered your bug report: ${title}`,
	POPUP_TYPE.neutral,
	false,
	() => openBugReport(id),
));
