import {
	mapped,
	type ValueIn,
} from '../../../helpers/mapped.js';

export const Skills = [
	'accuracy',
	'speed',
	'stamina',
	'jackspeed',
	'coordination',
	'release',
	'reading',
	'consistency',
	'concentration',
	'speedjam',
	'memory',
] as const;
export const SKILL = mapped(Skills);
export type SkillName = ValueIn<typeof SKILL>;



/** The "pressure" skills whose strained notes train consistency: playing
 *  through speed-family pressure without choking is what consistency rewards. */
export const PRESSURE_SKILLS: Set<SkillName> = new Set([
	SKILL.speed,
	SKILL.stamina,
	SKILL.jackspeed, 
	SKILL.coordination,
	SKILL.reading, 
	SKILL.speedjam,
]);

/** Trained by repetition, so no mindblock: they tire instead (server fatigue.ts). */
export const PHYSICAL_SKILLS: SkillName[] = [
	SKILL.speed,
	SKILL.stamina,
	SKILL.jackspeed,
	SKILL.coordination,
];

const MINDBLOCK_EXEMPT = new Set<SkillName>([
	...PHYSICAL_SKILLS,
	SKILL.memory,
]);
export const MINDBLOCK_SKILLS: SkillName[] = Skills.filter(s => !MINDBLOCK_EXEMPT.has(s));