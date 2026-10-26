import { __ } from '../../../i18n/translate.js';
import { medalText } from '../medalText.js';
import { skillName } from './display.js';
import type { SkillName } from './skills.js';

/** The skill as it reads inside a medal name - its own string, so a language
 *  can give it the form the name needs (French: "Adepte de la précision", so
 *  the skill is "de la précision" and the tier "Adepte {skill}"). The context
 *  must be a literal in each call for extraction. */
const MEDAL_SKILL: Record<SkillName, () => string> = {
	accuracy: () => __('Accuracy', 'skill in a medal name'),
	speed: () => __('Speed', 'skill in a medal name'),
	stamina: () => __('Stamina', 'skill in a medal name'),
	jackspeed: () => __('Jack Speed', 'skill in a medal name'),
	coordination: () => __('Coordination', 'skill in a medal name'),
	release: () => __('Release', 'skill in a medal name'),
	reading: () => __('Reading', 'skill in a medal name'),
	consistency: () => __('Consistency', 'skill in a medal name'),
	concentration: () => __('Concentration', 'skill in a medal name'),
	speedjam: () => __('SV', 'skill in a medal name'),
	memory: () => __('Memory', 'skill in a medal name'),
};

/** 4K's medal names and descriptions. */
export const { name: medalName, description: medalDescription } = medalText('', {
	inName: skill => (MEDAL_SKILL as Partial<Record<string, () => string>>)[skill]?.(),
	name: skill => skillName(skill as SkillName),
});
