import {
	describe,
	expect,
	it,
} from 'vitest';
import {
	batchIds,
	isCallbackUrl,
	oauthClientBody,
	parseScopes,
} from '@oss-idle/shared/oauth';

describe('oauth scopes', () => {
	it('reads space- and plus-separated scopes, once each', () => {
		expect(parseScopes('public identify')).toEqual(['public', 'identify']);
		expect(parseScopes('public+friends.read public')).toEqual(['public', 'friends.read']);
		expect(parseScopes(undefined)).toEqual([]);
	});

	it('refuses a scope we do not have', () => {
		expect(parseScopes('public chat.write')).toBeUndefined();
		expect(parseScopes('delegate')).toBeUndefined();
	});
});

describe('api v2 batch ids', () => {
	it('takes up to 10 positive ids from the query strings', () => {
		expect(batchIds.parse(['1', '42'])).toEqual([1, 42]);
		expect(batchIds.parse([])).toEqual([]);
		expect(batchIds.safeParse(Array.from({ length: 10 }, (_, i) => String(i + 1))).success).toBe(true);
	});

	it('refuses more than 10 ids, or a bad one', () => {
		expect(batchIds.safeParse(Array.from({ length: 11 }, (_, i) => String(i + 1))).success).toBe(false);
		expect(batchIds.safeParse(['0']).success).toBe(false);
		expect(batchIds.safeParse(['abc']).success).toBe(false);
	});
});

describe('oauth callback urls', () => {
	it('takes only http and https callbacks', () => {
		expect(isCallbackUrl('http://localhost:4000')).toBe(true);
		expect(isCallbackUrl('https://example.com/cb?x=1')).toBe(true);
		expect(isCallbackUrl('javascript:alert(1)//')).toBe(false);
		expect(isCallbackUrl('JavaScript:alert(1)')).toBe(false);
		expect(isCallbackUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
		expect(isCallbackUrl('not a url')).toBe(false);
	});

	it('refuses an application with a script callback', () => {
		const valid = (redirect: string) => oauthClientBody.safeParse({
			name: 'x', redirect: [redirect],
		}).success;
		expect(valid('javascript:alert(1)//')).toBe(false);
		expect(valid('https://example.com')).toBe(true);
	});
});
