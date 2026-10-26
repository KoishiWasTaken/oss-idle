import {
	describe,
	expect,
	it,
} from 'vitest';

import { makiseBotReply } from '@oss-idle/shared/community/makiseBot';

/** A die that always lands on its highest face, to read the max back. */
const reply = (text: string) => makiseBotReply(text, 'Okabe', max => max);

describe('makiseBotReply', () => {
	it('rolls to 100 by default', () => {
		expect(reply('!roll')).toBe('Okabe rolls 100 point(s)');
		expect(reply('!roll abc')).toBe('Okabe rolls 100 point(s)');
	});
	it('rolls to the given max, at least 1', () => {
		expect(reply('!roll 6')).toBe('Okabe rolls 6 point(s)');
		expect(reply('!roll 0')).toBe('Okabe rolls 1 point(s)');
		expect(reply('!roll -5 please')).toBe('Okabe rolls 1 point(s)');
	});
	it('answers !ping with pong', () => {
		expect(reply('!ping')).toBe('pong');
		expect(reply('  !PING  ')).toBe('pong');
	});
	it('ignores other text', () => {
		expect(reply('!rolls')).toBeUndefined();
		expect(reply('hi !roll')).toBeUndefined();
		expect(reply('!pingu')).toBeUndefined();
	});
});
