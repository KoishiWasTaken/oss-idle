import type { MedalCategory } from '../achievements/catalogue.js';
import type { MedalTier } from '../achievements/medal.js';
import {
	__,
	defineMessages,
} from '../i18n/translate.js';

const TIER_NAMES = defineMessages({
	bronze: 'Bronze medal',
	silver: 'Silver medal',
	gold: 'Gold medal',
	platinum: 'Platinum medal',
	divine: 'Divine medal',
} satisfies Record<MedalTier, string>);

export const medalTierName = (tier: MedalTier): string => __(TIER_NAMES[tier]);

const CATEGORY_NAMES = defineMessages({
	skill: 'Skill',
	dedication: 'Dedication',
	mastery: 'Mastery',
	ranked: 'Ranked',
	secret: 'Hush-Hush',
} satisfies Record<MedalCategory, string>);

export const medalCategoryName = (category: MedalCategory): string =>
	__(CATEGORY_NAMES[category]);
