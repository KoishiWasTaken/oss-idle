import {
	describe,
	expect,
	it,
} from 'vitest';

import {
	OSU_MODE,
	rulesetOf,
} from '@oss-idle/shared/rulesets/ids';

describe('rulesetOf', () => {
	it('picks the ruleset from mode and keys, no converts', () => {
		expect(rulesetOf(OSU_MODE.mania, 4)).toBe('mania4k');
		expect(rulesetOf(OSU_MODE.mania, 7)).toBe('mania7k');
		expect(rulesetOf(OSU_MODE.mania, 5)).toBeUndefined();
		expect(rulesetOf(OSU_MODE.osu, 4)).toBe('osu');
		expect(rulesetOf(OSU_MODE.taiko, 4)).toBeUndefined();
	});
});
