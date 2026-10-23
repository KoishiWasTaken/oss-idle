import {
	describe,
	it,
	expect,
	vi,
} from 'vitest';

const store = new Map<string, number>();
const builds = vi.fn(async () => []);
const broadcast = vi.fn();

vi.mock('../../server/src/env', () => ({
	env: {}, redisKeyPrefix: 'test:',
}));
vi.mock('../../server/src/redis', () => ({
	redis: {
		get: async (k: string) => store.has(k) ? String(store.get(k)) : null,
		incr: async (k: string) => store.set(k, (store.get(k) ?? 0) + 1).get(k),
		set: async (k: string, v: number) => { if (!store.has(k)) store.set(k, v); },
		del: async (k: string) => Number(store.delete(k)),
	},
}));
vi.mock('../../server/src/ws/hub', () => ({ hub: { broadcast } }));
const where = { where: builds };
const from = { from: () => ({ innerJoin: () => where }) };
vi.mock('../../server/src/db/client', () => ({ db: { select: () => from } }));

const {
	deferCatalogInvalidate,
	flushCatalogInvalidate,
	getCatalog,
	invalidateCatalog,
} = await import('../../server/src/beatmaps/catalog');

describe('catalog cache', () => {
	it('builds once for a herd and again after an invalidation', async () => {
		await Promise.all(Array.from({ length: 50 }, () => getCatalog()));
		expect(builds).toHaveBeenCalledTimes(1);

		await invalidateCatalog();
		expect(broadcast).toHaveBeenCalledWith({ type: 'catalog:invalidate' });
		await Promise.all(Array.from({ length: 50 }, () => getCatalog()));
		expect(builds).toHaveBeenCalledTimes(2);
	});

	it('does not keep a failed build', async () => {
		await invalidateCatalog();
		builds.mockRejectedValueOnce(new Error('db down'));
		await expect(getCatalog()).rejects.toThrow('db down');
		await getCatalog();
		expect(builds).toHaveBeenCalledTimes(4);
	});

	it('sends deferred changes once, 5 minutes after the first', async () => {
		vi.useFakeTimers();
		broadcast.mockClear();
		await deferCatalogInvalidate();
		vi.advanceTimersByTime(4 * 60_000);
		await deferCatalogInvalidate();
		await flushCatalogInvalidate();
		expect(broadcast).not.toHaveBeenCalled();

		vi.advanceTimersByTime(60_000);
		await Promise.all([flushCatalogInvalidate(), flushCatalogInvalidate()]);
		expect(broadcast).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});

	it('drops deferred changes an instant invalidation already sent', async () => {
		broadcast.mockClear();
		await deferCatalogInvalidate();
		await invalidateCatalog();
		vi.useFakeTimers();
		vi.advanceTimersByTime(5 * 60_000);
		await flushCatalogInvalidate();
		expect(broadcast).toHaveBeenCalledTimes(1);
		vi.useRealTimers();
	});
});
