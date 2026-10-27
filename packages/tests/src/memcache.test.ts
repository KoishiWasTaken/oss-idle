import {
	expect,
	it,
} from 'vitest';

import MemCache from '@oss-idle/shared/storage/memcache';

it('frees a key whose read failed', async () => {
	const cache = MemCache.get<number>('memcache.test');
	await expect(cache.process('k', () => Promise.reject(new Error('down')))).rejects.toThrow('down');
	await expect(cache.process('k', () => 1)).resolves.toBe(1);
});
