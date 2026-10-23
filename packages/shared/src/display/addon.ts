import {
	__,
	defineMessages,
} from '../i18n/translate.js';
import {
	ADDON_STATUS,
	ADDON_TYPE,
	type AddonStatus,
	type AddonType,
} from '../addon.js';

// Player-facing labels for the add-on moderation states, kept apart from the
// status keys the server/UI branch on (addon.ts owns those).
const STATUS_LABELS = defineMessages({
	[ADDON_STATUS.unpublished]: 'Unpublished',
	[ADDON_STATUS.pending]: 'Pending',
	[ADDON_STATUS.onHold]: 'On Hold',
	[ADDON_STATUS.denied]: 'Denied',
	[ADDON_STATUS.published]: 'Published',
} satisfies Record<AddonStatus, string>);

/** The localized label of an add-on's moderation status. */
export const addonStatusLabel = (
	status: AddonStatus,
): string => __(STATUS_LABELS[status]);

const TYPE_LABELS = defineMessages({
	[ADDON_TYPE.gameplay]: 'Gameplay',
	[ADDON_TYPE.editor]: 'Editor',
} satisfies Record<AddonType, string>);

/** The localized label of an add-on type. */
export const addonTypeLabel = (type: AddonType): string => __(TYPE_LABELS[type]);
