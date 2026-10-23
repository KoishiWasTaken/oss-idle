import {
	describe,
	it,
	expect,
} from 'vitest';
import {
	afterPlay,
	fatigueLevel,
	restedFatigue,
	tireSkill,
	type Fatigue,
} from '@oss-idle/shared/fatigue';
import Reading from '@oss-idle/shared/sim/skills/reading';
import Speed from '@oss-idle/shared/sim/skills/speed';
import { xpToLevel } from '@oss-idle/shared/sim/skills/xp';

const MAP = 3;
const GAP = 0.5;

/** Plays 3-minute maps back to back (30s apart), each strained this share of its length. */
const session = (shares: number[], from?: Fatigue) => {
	let fatigue = from;
	let now = from?.at ?? 0;
	for (const share of shares) {
		now += (GAP + MAP) * 60_000;
		fatigue = afterPlay(fatigue, MAP, share * MAP, now);
	}
	return fatigue!;
};
const level = (fatigue: Fatigue) => fatigueLevel(restedFatigue(fatigue, fatigue.at));
const loop = (share: number, hours: number) =>
	Array(Math.round(hours * 60 / (GAP + MAP))).fill(share);

describe('fatigue', () => {
	it('rests a fully strained map off with 2 or 3 easy ones', () => {
		const strained = session([1], session(loop(1, 1)));
		expect(session([0, 0], strained).minutes).toBeGreaterThan(strained.minutes - MAP);
		expect(session([0, 0, 0], strained).minutes).toBeLessThan(strained.minutes - MAP);
	});

	it('takes a 6 hour full strain session to floor, easing in', () => {
		expect(level(session(loop(1, 1)))).toBeLessThan(0.1);
		expect(level(session(loop(1, 3)))).toBeLessThan(0.6);
		expect(level(session(loop(1, 5)))).toBeLessThan(1);
		expect(level(session(loop(1, 8)))).toBeCloseTo(1);
	});

	it('tires a loop of normal maps much slower', () => {
		expect(level(session(loop(0.4, 6)))).toBeLessThan(0.05);
		expect(level(session(loop(0.25, 24)))).toBe(0);
	});

	it('plays an exhausted physical skill at the level a quarter of its xp reaches', () => {
		const speed = new Speed(80);
		speed.xp.set(500);
		tireSkill(speed, 1);
		expect(speed.level.get()).toBeLessThan(80);
		expect(xpToLevel(speed.level.get()) + speed.xp.get()).toBeCloseTo((xpToLevel(80) + 500) / 4);

		const reading = new Reading(80);
		tireSkill(reading, 1);
		expect(reading.level.get()).toBe(80);
	});
});
