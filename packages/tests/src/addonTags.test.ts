import {
	describe,
	expect,
	it,
} from 'vitest';

import { newestTag } from '../../server/src/addonTags';

const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
const c = 'c'.repeat(40);
const d = 'd'.repeat(40);

describe('newestTag', () => {
	it('picks the highest version, not the last listed', () => {
		expect(newestTag([
			`${a}\trefs/tags/v1.10.0`,
			`${b}\trefs/tags/v1.9.3`,
			`${c}\trefs/tags/1.2.0`,
		].join('\n'))).toEqual({
			tag: 'v1.10.0', commit: a,
		});
	});

	it('follows an annotated tag to its commit', () => {
		expect(newestTag([
			`${a}\trefs/tags/v2.0.0`,
			`${b}\trefs/tags/v2.0.0^{}`,
		].join('\n'))).toEqual({
			tag: 'v2.0.0', commit: b,
		});
	});

	it('ignores tags that are not versions', () => {
		expect(newestTag([
			`${a}\trefs/tags/v3.0.0-beta`,
			`${b}\trefs/tags/release`,
			`${d}\trefs/heads/v9.9.9`,
			`${c}\trefs/tags/v0.1.0`,
		].join('\n'))).toEqual({
			tag: 'v0.1.0', commit: c,
		});
		expect(newestTag('')).toBeUndefined();
	});

	it('ignores a sha that is not one, from a hostile git server', () => {
		expect(newestTag([
			'--output=/w/x\trefs/tags/v9.0.0',
			`${a}\trefs/tags/v1.0.0`,
		].join('\n'))).toEqual({
			tag: 'v1.0.0', commit: a,
		});
	});
});
