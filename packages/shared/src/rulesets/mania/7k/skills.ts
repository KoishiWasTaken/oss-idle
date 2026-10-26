import {
	mapped,
	type ValueIn,
} from '../../../helpers/mapped.js';

export const Skills7k = [
	'accuracy',
	'speed',
	'stamina',
	'chords',
	'independence',
	'ln',
	'technical',
	'focus',
	'sv',
	'memory',
] as const;
export const SKILL_7K = mapped(Skills7k);
export type SkillName7k = ValueIn<typeof SKILL_7K>;

/** Trained by repetition, so no mindblock: they tire instead. */
export const PHYSICAL_SKILLS_7K: SkillName7k[] = [
	SKILL_7K.speed,
	SKILL_7K.stamina,
	SKILL_7K.chords,
	SKILL_7K.ln,
];

export const MINDBLOCK_SKILLS_7K: SkillName7k[] = Skills7k
	.filter(s => !PHYSICAL_SKILLS_7K.includes(s) && s !== SKILL_7K.memory);

/** The middle key is the right thumb's: the right hand has four keys. */
export const handOf = (column: number): 'left' | 'right' => column < 3 ? 'left' : 'right';
