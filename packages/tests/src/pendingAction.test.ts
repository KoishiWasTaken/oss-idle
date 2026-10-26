import {
	describe,
	expect,
	it,
} from 'vitest';

import { characterDTO } from '@oss-idle/shared/character';
import { pendingActionDTO } from '@oss-idle/shared/pendingAction';
import {
	SKILL,
	Skills,
} from '@oss-idle/shared/rulesets/mania/4k/skills';

const character = () => ({
	id: 1,
	userId: 1,
	name: 'Adri',
	avatarUrl: 'https://example.invalid/a.png',
	ruleset: 'mania4k',
	generation: 1,
	overallLevel: 42,
	skills: Object.fromEntries(Skills.map(s => [s, {
		level: 0,
		xp: 0,
		upgrades: 0,
		overdrive: 0,
		prestige: 0,
		lifetimeXp: 0,
	}])),
});

describe('pending action', () => {
	it('carries the skill for the two per-skill actions', () => {
		for (const type of ['upgrade', 'prestige'] as const) {
			const parsed = pendingActionDTO.parse({
				type, ruleset: 'mania4k', skill: SKILL.coordination, requestedAt: 1,
			});
			expect(parsed).toEqual({
				type, ruleset: 'mania4k', skill: SKILL.coordination, requestedAt: 1,
			});
		}
	});

	it('carries the new name for a rebirth', () => {
		expect(pendingActionDTO.parse({
			type: 'rebirth', ruleset: 'mania4k', name: 'Adri', requestedAt: 1,
		})).toEqual({
			type: 'rebirth', ruleset: 'mania4k', name: 'Adri', requestedAt: 1,
		});
	});

	it('rejects an action the finalise would not know how to run', () => {
		expect(() => pendingActionDTO.parse({
			type: 'ascend', ruleset: 'mania4k', skill: SKILL.speed, requestedAt: 1,
		})).toThrow();
		// bought in no ruleset, it would land in none
		expect(() => pendingActionDTO.parse({
			type: 'upgrade', skill: SKILL.speed, requestedAt: 1,
		})).toThrow();
		expect(() => pendingActionDTO.parse({
			type: 'upgrade', ruleset: 'taiko', skill: SKILL.speed, requestedAt: 1,
		})).toThrow();
		// a per-skill action without its skill is what a half-migrated row looks like
		expect(() => pendingActionDTO.parse({
			type: 'upgrade', ruleset: 'mania4k', requestedAt: 1,
		})).toThrow();
	});
});

describe('character DTO', () => {
	it('is unchanged for a character with nothing queued', () => {
		const parsed = characterDTO.parse(character());
		expect(parsed.pendingActions).toBeUndefined();
	});

	it('carries every action the play deferred, in order', () => {
		const actions = [
			{
				type: 'upgrade', ruleset: 'mania4k', skill: SKILL.stamina, requestedAt: 1,
			},
			{
				type: 'upgrade', ruleset: 'mania4k', skill: SKILL.speed, requestedAt: 2,
			},
			{
				type: 'prestige', ruleset: 'mania4k', skill: SKILL.stamina, requestedAt: 3,
			},
		];
		const parsed = characterDTO.parse({
			...character(), pendingActions: actions,
		});
		expect(parsed.pendingActions).toEqual(actions);
	});
});
