import {
	describe,
	expect,
	it,
} from 'vitest';

import { emojiMatcher } from '@oss-idle/shared/community/emoji';

const sob = {
	id: 1, name: 'sob', unicode: '😭', 
};
const heart = {
	id: 2, name: 'heart', unicode: '❤️', 
};
const oss = {
	id: 3, name: 'oss', 
};
const own = {
	id: 4, name: 'own', owner: { userId: 7 }, 
};
const lent = {
	id: 5, name: 'lent', owner: { userId: 7 }, shared: true, 
};
const { split } = emojiMatcher([sob, heart, oss, own, lent]);

describe('emojiMatcher', () => {
	it('finds :names:, any case, and leaves unknown ones as text', () => {
		expect(split('gg :SOB: :nope: :oss::sob:')).toEqual(['gg ', sob, ' :nope: ', oss, sob]);
	});

	it('finds the characters, with or without the variation selector', () => {
		expect(split('😭❤ ❤️!')).toEqual([sob, heart, ' ', heart, '!']);
	});

	it('draws a supporter\'s own only in their lines, unless they shared it', () => {
		expect(split(':own: :lent:', 7)).toEqual([own, ' ', lent]);
		expect(split(':own: :lent:', 8)).toEqual([':own: ', lent]);
		expect(split(':own:')).toEqual([':own:']);
	});

	it('leaves text without emoji whole', () => {
		expect(split('a: b :c')).toEqual(['a: b :c']);
	});
});
