import cubic_bezier from './math/cubic_bezier.js';
import lerp from './math/lerp.js';
import type Skill from './sim/skills/skill.js';
import Memory from './sim/skills/memory.js';
import { makeOrderedSkills } from './sim/skills/factory.js';
import {
	xpGivesLevel,
	xpToLevel,
} from './sim/skills/xp.js';
import { PHYSICAL_SKILLS } from './skills.js';

/** The character's fatigue in strained minutes, as of `at` (ms). */
export type Fatigue = { at: number, minutes: number };

// The character tires a minute per minute its physical skills are strained and
// rests REST_RATE per other minute, played or idle: one fully strained map takes
// 2-3 easy ones to rest. From fresh, nonstop full strain reaches the floor in
// about 6 hours.
const REST_RATE = 0.4;
const FULL_MINUTES = 6 * 60;
const FATIGUE_CB = cubic_bezier(.6, 0, .6, 1);
// exhausted, the physical skills play with a quarter of their xp and earn XP_FLOOR
// of their gains: one map on loop averages about x0.1 a day
const PLAY_FLOOR = 0.25;
const XP_FLOOR = 0.05;

/** The fatigue left at `now`, rested since the last play. */
export const restedFatigue = (fatigue: Fatigue | undefined, now: number): number =>
	Math.max(0, (fatigue?.minutes ?? 0) - REST_RATE * Math.max(0, now - (fatigue?.at ?? now)) / 60_000);

/** How tired `minutes` of fatigue leave the character: 0 rested, 1 exhausted. */
export const fatigueLevel = (minutes: number): number =>
	FATIGUE_CB(Math.min(1, minutes / FULL_MINUTES));

/** The share of the physical skills' xp gains a play at fatigue `level` keeps. */
export const fatigueXp = (level: number): number => lerp(1, XP_FLOOR, level);

/** The fatigue after a play that ended `now`, `minutes` long, `strained` of them. */
export const afterPlay = (
	before: Fatigue | undefined,
	minutes: number,
	strained: number,
	now: number,
): Fatigue => {
	const rested = restedFatigue(before, now - minutes * 60_000);
	const next = rested + strained - REST_RATE * (minutes - strained);
	return {
		at: now, minutes: Math.min(FULL_MINUTES, Math.max(0, next)),
	};
};

/** A physical skill at fatigue `fatigue` plays at the level part of the xp behind its level reaches. */
export const tireSkill = (skill: Skill, fatigue: number) => {
	if (fatigue <= 0 || !PHYSICAL_SKILLS.includes(skill.name)) return;
	const kept = lerp(1, PLAY_FLOOR, fatigue);
	const { level, xp } = xpGivesLevel((xpToLevel(skill.level.get()) + skill.xp.get()) * kept);
	skill.level.set(level);
	skill.xp.set(xp);
};

/** A tired copy of `skills`, leaving the originals as they are. */
export const tiredSkills = (skills: Skill[], fatigue: number): Skill[] =>
	makeOrderedSkills().map(copy => {
		const skill = skills.find(s => s.name === copy.name)!;
		copy.apply(skill.state());
		if (copy instanceof Memory && skill instanceof Memory) {
			copy.timesPlayed.set(skill.timesPlayed.get());
		}
		tireSkill(copy, fatigue);
		return copy;
	});
